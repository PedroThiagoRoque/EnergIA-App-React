import { sessionManager } from '../lib/auth/session';
import { AuthTokens, User, StorageKeys } from '../lib/types';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('SessionManager', () => {
  const mockTokens: AuthTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 3600,

  };

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    // createdAt: '2023-01-01T00:00:00Z',
    // updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setTokens', () => {
    it('should store tokens securely', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();

      await sessionManager.setTokens(mockTokens);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        StorageKeys.ACCESS_TOKEN,
        mockTokens.accessToken
      );
      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        StorageKeys.REFRESH_TOKEN,
        mockTokens.refreshToken
      );
    });

    it('should handle storage errors gracefully', async () => {
      mockSecureStore.setItemAsync.mockRejectedValue(new Error('Storage error'));

      await expect(sessionManager.setTokens(mockTokens)).rejects.toThrow(
        'Failed to store authentication tokens'
      );
    });

    it('should store expiration time when expiresIn is provided', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      await sessionManager.setTokens(mockTokens);

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        StorageKeys.TOKEN_EXPIRES_AT,
        (now + mockTokens.expiresIn! * 1000).toString()
      );

      jest.restoreAllMocks();
    });
  });

  describe('getAccessToken', () => {
    it('should retrieve access token', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(mockTokens.accessToken);

      const token = await sessionManager.getAccessToken();

      expect(token).toBe(mockTokens.accessToken);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(StorageKeys.ACCESS_TOKEN);
    });

    it('should return null when token not found', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const token = await sessionManager.getAccessToken();

      expect(token).toBeNull();
    });

    it('should handle retrieval errors gracefully', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const token = await sessionManager.getAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should retrieve refresh token', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(mockTokens.refreshToken);

      const token = await sessionManager.getRefreshToken();

      expect(token).toBe(mockTokens.refreshToken);
      expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(StorageKeys.REFRESH_TOKEN);
    });
  });

  describe('getTokens', () => {
    it('should retrieve all tokens', async () => {
      const expiresAt = Date.now() + 3600000;
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken)
        .mockResolvedValueOnce(expiresAt.toString());

      const tokens = await sessionManager.getTokens();

      expect(tokens).toEqual({
        accessToken: mockTokens.accessToken,
        refreshToken: mockTokens.refreshToken,
        expiresAt,
        expiresIn: expect.any(Number),
      });
    });

    it('should return null when tokens are missing', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTokens.refreshToken)
        .mockResolvedValueOnce(null);

      const tokens = await sessionManager.getTokens();

      expect(tokens).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false when token is not expired', async () => {
      const futureTime = Date.now() + 3600000; // 1 hour in future
      mockSecureStore.getItemAsync.mockResolvedValue(futureTime.toString());

      const isExpired = await sessionManager.isTokenExpired();

      expect(isExpired).toBe(false);
    });

    it('should return true when token is expired', async () => {
      const pastTime = Date.now() - 3600000; // 1 hour in past
      mockSecureStore.getItemAsync.mockResolvedValue(pastTime.toString());

      const isExpired = await sessionManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });

    it('should return false when no expiration time is set', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const isExpired = await sessionManager.isTokenExpired();

      expect(isExpired).toBe(false);
    });

    it('should return true on storage error', async () => {
      mockSecureStore.getItemAsync.mockRejectedValue(new Error('Storage error'));

      const isExpired = await sessionManager.isTokenExpired();

      expect(isExpired).toBe(true);
    });
  });

  describe('setUser and getUser', () => {
    it('should store and retrieve user data', async () => {
      mockSecureStore.setItemAsync.mockResolvedValue();
      mockSecureStore.getItemAsync.mockResolvedValue(JSON.stringify(mockUser));

      await sessionManager.setUser(mockUser);
      const user = await sessionManager.getUser();

      expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(
        StorageKeys.USER_DATA,
        JSON.stringify(mockUser)
      );
      expect(user).toEqual(mockUser);
    });

    it('should return null when user data not found', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const user = await sessionManager.getUser();

      expect(user).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid token exists', async () => {
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockTokens.accessToken) // getAccessToken
        .mockResolvedValueOnce(null); // isTokenExpired (no expiration time)

      const isAuth = await sessionManager.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false when no token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);

      const isAuth = await sessionManager.isAuthenticated();

      expect(isAuth).toBe(false);
    });

    it('should return true when token expired but refresh token exists', async () => {
      const pastTime = Date.now() - 3600000;
      mockSecureStore.getItemAsync
        .mockResolvedValueOnce(mockTokens.accessToken) // getAccessToken
        .mockResolvedValueOnce(pastTime.toString()) // isTokenExpired
        .mockResolvedValueOnce(mockTokens.refreshToken); // getRefreshToken

      const isAuth = await sessionManager.isAuthenticated();

      expect(isAuth).toBe(true);
    });
  });

  describe('clearSession', () => {
    it('should clear all session data', async () => {
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      await sessionManager.clearSession();

      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKeys.ACCESS_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKeys.REFRESH_TOKEN);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKeys.USER_DATA);
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(StorageKeys.TOKEN_EXPIRES_AT);
    });

    it('should not throw error when cleanup fails', async () => {
      mockSecureStore.deleteItemAsync.mockRejectedValue(new Error('Storage error'));

      await expect(sessionManager.clearSession()).resolves.toBeUndefined();
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      const refreshFn = jest.fn().mockResolvedValue(newTokens);
      mockSecureStore.getItemAsync.mockResolvedValue(mockTokens.refreshToken);
      mockSecureStore.setItemAsync.mockResolvedValue();

      const result = await sessionManager.refreshTokens(refreshFn);

      expect(result).toEqual(newTokens);
      expect(refreshFn).toHaveBeenCalledWith(mockTokens.refreshToken);
    });

    it('should clear session when refresh fails', async () => {
      const refreshFn = jest.fn().mockRejectedValue(new Error('Refresh failed'));
      mockSecureStore.getItemAsync.mockResolvedValue(mockTokens.refreshToken);
      mockSecureStore.deleteItemAsync.mockResolvedValue();

      const result = await sessionManager.refreshTokens(refreshFn);

      expect(result).toBeNull();
      expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledTimes(4); // clearSession
    });

    it('should handle simultaneous refresh attempts', async () => {
      const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      const refreshFn = jest.fn().mockResolvedValue(newTokens);
      mockSecureStore.getItemAsync.mockResolvedValue(mockTokens.refreshToken);
      mockSecureStore.setItemAsync.mockResolvedValue();

      // Start multiple refresh attempts simultaneously
      const promises = [
        sessionManager.refreshTokens(refreshFn),
        sessionManager.refreshTokens(refreshFn),
        sessionManager.refreshTokens(refreshFn),
      ];

      const results = await Promise.all(promises);

      // All should return the same result
      results.forEach((result: AuthTokens | null) => {
        expect(result).toEqual(newTokens);
      });

      // But refresh function should only be called once
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });
  });
});