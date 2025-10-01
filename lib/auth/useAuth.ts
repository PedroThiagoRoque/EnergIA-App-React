import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { router } from 'expo-router';
import { ApiClient } from '../api/axios';
import { sessionManager } from './session';
import type {
  User,
  LoginRequest,
  LoginResponse,
  SessionState,
  ApiResponse,
  AuthTokens,
} from '../types/auth';

// Contexto de autenticação
interface AuthContextType extends SessionState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({
    isAuthenticated: false,
    user: null,
    tokens: null,
    isLoading: true,
    error: null,
  });

  const apiClient = new ApiClient({
    baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://api.energia.com',
    timeout: 10000,
  });

  // Verificar sessão existente ao inicializar
  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const accessToken = await sessionManager.getAccessToken();
      if (!accessToken) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Verificar se o token não expirou
      const isExpired = await sessionManager.isTokenExpired();
      if (isExpired) {
        // Tentar renovar o token
        const newTokens = await sessionManager.refreshTokens(async (refreshToken) => {
          const response = await apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', {
            refreshToken,
          });
          if (!response.success || !response.data?.data) {
            throw new Error('Token refresh failed');
          }
          return response.data.data.tokens;
        });
        if (!newTokens) {
          await sessionManager.clearSession();
          setState(prev => ({ ...prev, isLoading: false }));
          return;
        }
      }

      // Buscar dados do usuário
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        const tokens = await sessionManager.getTokens();
        setState({
          isAuthenticated: true,
          user: response.data,
          tokens,
          isLoading: false,
          error: null,
        });
      } else {
        await sessionManager.clearSession();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      await sessionManager.clearSession();
      setState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: 'Failed to initialize authentication',
      });
    }
  }, [apiClient]);

  // Login
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validação básica
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      if (!isValidEmail(credentials.email)) {
        throw new Error('Invalid email format');
      }

      // Fazer login na API
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { user, tokens } = response.data;

      // Armazenar tokens
      await sessionManager.setTokens({
        ...tokens,
        expiresAt: Date.now() + (tokens.expiresIn || 3600) * 1000,
      });

      // Atualizar estado
      setState({
        isAuthenticated: true,
        user,
        tokens,
        isLoading: false,
        error: null,
      });

      // Redirecionar para a tela principal
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [apiClient]);

  // Logout
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Tentar fazer logout na API (não bloquear se falhar)
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        console.warn('Failed to logout on server:', error);
      }

      // Limpar sessão local
      await sessionManager.clearSession();

      setState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });

      // Redirecionar para login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Mesmo se der erro, limpar o estado local
      setState({
        isAuthenticated: false,
        user: null,
        tokens: null,
        isLoading: false,
        error: null,
      });
      router.replace('/(auth)/login');
    }
  }, [apiClient]);

  // Renovar sessão
  const refreshSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const newTokens = await sessionManager.refreshTokens(async (refreshToken) => {
        const response = await apiClient.post<ApiResponse<{ tokens: AuthTokens }>>('/auth/refresh', {
          refreshToken,
        });
        if (!response.success || !response.data?.data) {
          throw new Error('Token refresh failed');
        }
        return response.data.data.tokens;
      });
      
      if (!newTokens) {
        await logout();
        return;
      }

      // Buscar dados atualizados do usuário
      const response = await apiClient.get<User>('/auth/me');
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          user: response.data,
          tokens: newTokens,
          isLoading: false,
        }));
      } else {
        await logout();
      }
    } catch (error) {
      console.error('Refresh session error:', error);
      await logout();
    }
  }, [apiClient, logout]);

  // Inicializar autenticação ao montar o componente
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshSession,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

// Hook para usar o contexto de autenticação
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook simples para componentes que só precisam saber se está autenticado
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

// Utilitários
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de senha (pode ser expandida conforme necessário)
export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return errors;
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  return errors;
}

// Hook para validação de formulário de login
export function useLoginValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((email: string, password: string) => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Invalid email format';
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return { errors, validateForm, clearErrors };
}