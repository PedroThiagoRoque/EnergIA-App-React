import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { router } from 'expo-router';
import { loginUser, loginUserAlternative, loginUserSimple, checkAuth, logoutUser, getUserData } from '../api/energia-simple';
import type {
  User,
  LoginRequest,
  SessionState,
} from '../types/auth';

// Contexto de autenticação simplificado
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
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

      const isAuth = await checkAuth();
      console.log('🔍 useAuth: Status de autenticação:', isAuth);
      
      if (isAuth) {
        console.log('✅ useAuth: Usuário autenticado, buscando dados...');
        const userData = await getUserData();
        setIsAuthenticated(true);
        setUser(userData || { name: 'Usuário', email: '' });
        console.log('✅ useAuth: Autenticação inicializada com sucesso');
      } else {
        console.log('❌ useAuth: Usuário não autenticado');
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('💥 useAuth: Falha ao inicializar auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setError('Erro ao verificar autenticação');
    } finally {
      setIsLoading(false);
      console.log('🏁 useAuth: Inicialização finalizada');
    }
  }, []);

  // Login com validação integrada
  const login = useCallback(async (credentials: LoginRequest) => {
    console.log('🚀 useAuth: Iniciando processo de login unificado...');
    
    try {
      setIsLoading(true);
      setError(null);

      // 1. Validação básica de formato
      if (!credentials.email || !credentials.password) {
        console.log('❌ useAuth: Credenciais vazias');
        throw new Error('Email e senha são obrigatórios');
      }

      if (!isValidEmail(credentials.email)) {
        console.log('❌ useAuth: Email inválido:', credentials.email);
        throw new Error('Formato de email inválido');
      }

      if (credentials.password.length < 3) {
        console.log('❌ useAuth: Senha muito curta');
        throw new Error('Senha deve ter pelo menos 3 caracteres');
      }

      console.log('✅ useAuth: Validação de formato OK, iniciando login...');

      // 2. Estratégia de login em cascata (do mais simples ao mais complexo)
      console.log('🎯 useAuth: Tentando login simples e direto...');
      let response = await loginUserSimple({
        email: credentials.email.trim(),
        password: credentials.password
      });

      // Se falhar, tentar método alternativo
      if (!response.success) {
        console.log('🔄 useAuth: Login simples falhou, tentando método alternativo...');
        response = await loginUserAlternative({
          email: credentials.email.trim(),
          password: credentials.password
        });
      }

      // Se ainda falhar, tentar método completo
      if (!response.success) {
        console.log('⚠️ useAuth: Métodos anteriores falharam, tentando método completo...');
        response = await loginUser({
          email: credentials.email.trim(),
          password: credentials.password
        });
      }

      console.log('📥 useAuth: Resposta final da API:', response);

      if (!response.success) {
        console.log('❌ useAuth: Todos os métodos de login falharam');
        throw new Error('Email ou senha inválidos. Verifique suas credenciais e tente novamente.');
      }

      console.log('✅ useAuth: Login bem-sucedido, buscando dados do usuário...');

      // 3. Buscar dados do usuário após login
      const userData = await getUserData();
      
      console.log('👤 useAuth: Dados do usuário obtidos:', userData);
      
      setIsAuthenticated(true);
      setUser(userData || { name: 'Usuário', email: credentials.email });
      setError(null);

      console.log('🎯 useAuth: Redirecionando para dashboard...');
      // Redirecionar para dashboard
      router.replace('/(tabs)');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no login';
      console.error('💥 useAuth: Erro no login:', error);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
      console.log('🏁 useAuth: Processo de login unificado finalizado');
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Tentar fazer logout na API
      await logoutUser();
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