import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthGuard, useAuthGuard } from '../lib/auth/AuthGuard';
import { useAuthStatus } from '../lib/auth/useAuth';

// Mock the useAuthStatus hook
jest.mock('../lib/auth/useAuth', () => ({
  useAuthStatus: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  Redirect: ({ href }: { href: string }) => {
    return React.createElement('MockRedirect', { href });
  },
}));

const mockUseAuthStatus = useAuthStatus as jest.MockedFunction<typeof useAuthStatus>;

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading when authentication status is loading', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { getByTestId } = render(
      <AuthGuard>
        <Text>Protected content</Text>
      </AuthGuard>
    );

    // Should show loading indicator
    expect(() => getByTestId('loading-indicator')).not.toThrow();
  });

  it('should redirect to login when requireAuth=true and user is not authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { UNSAFE_getByType } = render(
      <AuthGuard requireAuth={true}>
        <Text>Protected content</Text>
      </AuthGuard>
    );

    // Should render Redirect component
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const redirect = UNSAFE_getByType('MockRedirect' as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    expect(redirect.props.href).toBe('/(auth)/login');
  });

  it('should redirect to tabs when requireAuth=false and user is authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { UNSAFE_getByType } = render(
      <AuthGuard requireAuth={false}>
        <Text>Public content</Text>
      </AuthGuard>
    );

    // Should render Redirect component
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const redirect = UNSAFE_getByType('MockRedirect' as any);
    /* eslint-enable @typescript-eslint/no-explicit-any */
    expect(redirect.props.href).toBe('/(tabs)');
  });

  it('should render children when requireAuth=true and user is authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { getByText } = render(
      <AuthGuard requireAuth={true}>
        <Text>Protected content</Text>
      </AuthGuard>
    );

    expect(getByText('Protected content')).toBeTruthy();
  });

  it('should render children when requireAuth=false and user is not authenticated', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { getByText } = render(
      <AuthGuard requireAuth={false}>
        <Text>Public content</Text>
      </AuthGuard>
    );

    expect(getByText('Public content')).toBeTruthy();
  });

  it('should render custom fallback during loading', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const CustomFallback = () => <Text>Custom loading...</Text>;

    const { getByText } = render(
      <AuthGuard fallback={<CustomFallback />}>
        <Text>Protected content</Text>
      </AuthGuard>
    );

    expect(getByText('Custom loading...')).toBeTruthy();
  });
});

describe('useAuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct values when loading', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { result } = require('@testing-library/react-hooks').renderHook(() =>
      useAuthGuard(true)
    );

    expect(result.current.canAccess).toBeNull();
    expect(result.current.redirectPath).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return correct values when authenticated and requireAuth=true', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = require('@testing-library/react-hooks').renderHook(() =>
      useAuthGuard(true)
    );

    expect(result.current.canAccess).toBe(true);
    expect(result.current.redirectPath).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct values when not authenticated and requireAuth=true', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { result } = require('@testing-library/react-hooks').renderHook(() =>
      useAuthGuard(true)
    );

    expect(result.current.canAccess).toBe(false);
    expect(result.current.redirectPath).toBe('/(auth)/login');
    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct values when authenticated and requireAuth=false', () => {
    mockUseAuthStatus.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { result } = require('@testing-library/react-hooks').renderHook(() =>
      useAuthGuard(false)
    );

    expect(result.current.canAccess).toBe(false);
    expect(result.current.redirectPath).toBe('/(tabs)');
    expect(result.current.isLoading).toBe(false);
  });
});