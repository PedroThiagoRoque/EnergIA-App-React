import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStatus } from './useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Componente que protege rotas baseado no status de autenticação
 * 
 * @param children - Conteúdo a ser renderizado se a condição for atendida
 * @param fallback - Componente a ser renderizado durante loading (opcional)
 * @param requireAuth - Se true, requer autenticação. Se false, requer não estar autenticado
 */
export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuthStatus();

  // Mostrar loading durante verificação
  if (isLoading) {
    return fallback || (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Se requer autenticação mas não está autenticado
  if (requireAuth && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Se não deve estar autenticado mas está
  if (!requireAuth && isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  // Condição atendida, renderizar conteúdo
  return <>{children}</>;
}

/**
 * Hook para verificar se o usuário pode acessar uma rota protegida
 */
export function useAuthGuard(requireAuth: boolean = true) {
  const { isAuthenticated, isLoading } = useAuthStatus();

  const canAccess = React.useMemo(() => {
    if (isLoading) return null; // Ainda carregando
    return requireAuth ? isAuthenticated : !isAuthenticated;
  }, [isAuthenticated, isLoading, requireAuth]);

  const redirectPath = React.useMemo(() => {
    if (isLoading || canAccess) return null;
    return requireAuth ? '/(auth)/login' : '/(tabs)';
  }, [canAccess, isLoading, requireAuth]);

  return {
    canAccess,
    redirectPath,
    isLoading,
    isAuthenticated,
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
});