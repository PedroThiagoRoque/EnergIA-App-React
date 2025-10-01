import { renderHook, act } from '@testing-library/react-native';
import { useLoginValidation, validatePassword } from '../lib/auth/useAuth';

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

// Mock API client
jest.mock('../lib/api/axios', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  })),
}));

// Mock session manager
jest.mock('../lib/auth/session', () => ({
  sessionManager: {
    getAccessToken: jest.fn(),
    isTokenExpired: jest.fn(),
    refreshTokens: jest.fn(),
    setTokens: jest.fn(),
    clearSession: jest.fn(),
    getTokens: jest.fn(),
  },
}));

describe('useLoginValidation', () => {
  it('should validate email correctly', () => {
    const { result } = renderHook(() => useLoginValidation());

    // Test valid email
    act(() => {
      const isValid = result.current.validateForm('test@example.com', 'password123');
      expect(isValid).toBe(true);
    });

    // Test invalid email
    act(() => {
      const isValid = result.current.validateForm('invalid-email', 'password123');
      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('Invalid email format');
    });

    // Test empty email
    act(() => {
      const isValid = result.current.validateForm('', 'password123');
      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('Email is required');
    });
  });

  it('should validate password correctly', () => {
    const { result } = renderHook(() => useLoginValidation());

    // Test valid password
    act(() => {
      const isValid = result.current.validateForm('test@example.com', 'password123');
      expect(isValid).toBe(true);
    });

    // Test short password
    act(() => {
      const isValid = result.current.validateForm('test@example.com', '123');
      expect(isValid).toBe(false);
      expect(result.current.errors.password).toBe('Password must be at least 6 characters long');
    });

    // Test empty password
    act(() => {
      const isValid = result.current.validateForm('test@example.com', '');
      expect(isValid).toBe(false);
      expect(result.current.errors.password).toBe('Password is required');
    });
  });

  it('should clear errors', () => {
    const { result } = renderHook(() => useLoginValidation());

    // Add some errors
    act(() => {
      result.current.validateForm('', '');
    });

    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);

    // Clear errors
    act(() => {
      result.current.clearErrors();
    });

    expect(Object.keys(result.current.errors).length).toBe(0);
  });
});

describe('validatePassword', () => {
  it('should validate password requirements', () => {
    // Empty password
    expect(validatePassword('')).toEqual(['Password is required']);

    // Short password
    expect(validatePassword('123')).toEqual(['Password must be at least 6 characters long']);

    // Valid password
    expect(validatePassword('password123')).toEqual([]);
  });
});

describe('Email validation', () => {
  // Test the isValidEmail function indirectly through useLoginValidation
  const testEmails = [
    { email: 'test@example.com', valid: true },
    { email: 'user.name@domain.co.uk', valid: true },
    { email: 'invalid-email', valid: false },
    { email: '@domain.com', valid: false },
    { email: 'test@', valid: false },
    { email: 'test.domain.com', valid: false },
    { email: '', valid: false },
  ];

  testEmails.forEach(({ email, valid }) => {
    it(`should ${valid ? 'accept' : 'reject'} email: ${email}`, () => {
      const { result } = renderHook(() => useLoginValidation());

      act(() => {
        result.current.validateForm(email, 'password123');
      });

      if (valid) {
        expect(result.current.errors.email).toBeUndefined();
      } else {
        expect(result.current.errors.email).toBeDefined();
      }
    });
  });
});