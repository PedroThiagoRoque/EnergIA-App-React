import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { router } from 'expo-router';
import { authService } from '../api/services/auth';
import { userService } from '../api/services/user';
import type {
  User,
  LoginCredentials,
  RegisterData, // Added RegisterData
} from '../types';

// Contexto de autenticação simplificado
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>; // Added register
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Provider de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação ao inicializar
  const initializeAuth = useCallback(async () => {
    console.log('🔄 useAuth: Inicializando autenticação...');

    try {
      setIsLoading(true);
      setError(null);

      // Check if we have a token by trying to get user data
      // If this fails (401), the interceptor will catch it or it will throw
      const userData = await userService.getDashboard();
      setIsAuthenticated(true);
      setUser(userData);
      console.log('✅ useAuth: Autenticação inicializada com sucesso');
    } catch (_error) {
      // If 401 or network error, assume not authenticated
      console.log('❌ useAuth: Usuário não autenticado ou sessão expirada');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('🏁 useAuth: Inicialização finalizada');
    }
  }, []);

  // Login com validação integrada
  const login = useCallback(async (credentials: LoginCredentials) => {
    console.log('🚀 useAuth: Iniciando login...');

    try {
      setIsLoading(true);
      setError(null);

      // 1. Validação básica
      if (!credentials.email || !credentials.password) {
        throw new Error('Email e senha são obrigatórios');
      }

      // 2. Login via serviço
      const response = await authService.login(credentials);

      console.log('✅ useAuth: Login bem-sucedido');

      // 3. Atualizar estado
      setIsAuthenticated(true);
      setUser(response.user);

      // 4. Redirecionar
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('💥 useAuth: Erro no login:', error);
      setError(error.message || 'Falha ao realizar login');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    console.log('📝 useAuth: Iniciando registro...');

    try {
      setIsLoading(true);
      setError(null);

      // Call service
      const response = await authService.register(data);

      console.log('✅ useAuth: Registro bem-sucedido');

      // Update state
      setIsAuthenticated(true);
      setUser(response.user);

      // Redirect
      router.replace('/(tabs)');

    } catch (error: any) {
      console.error('💥 useAuth: Erro no registro:', error);
      setError(error.message || 'Falha ao realizar registro');
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Tentar fazer logout na API
      await authService.logout();
    } catch (error) {
      console.warn('Failed to logout on server:', error);
    } finally {
      // Sempre limpar estado local
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      setIsLoading(false);

      // Redirecionar para login
      router.replace('/(auth)/login');
    }
  }, []);

  // Inicializar autenticação ao montar o componente
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    register, // Added register
    logout,
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