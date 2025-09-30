import * as SecureStore from 'expo-secure-store';
import { AuthTokens, User, StorageKeys } from '../types';

/**
 * Session management using Expo SecureStore for secure token storage.
 * Handles token storage, retrieval, refresh, and cleanup with proper error handling.
 */
class SessionManager {
  private static instance: SessionManager;
  private refreshPromise: Promise<AuthTokens | null> | null = null;

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Store authentication tokens securely
   */
  async setTokens(tokens: AuthTokens): Promise<void> {
    try {
      const expiresAt = tokens.expiresIn 
        ? Date.now() + (tokens.expiresIn * 1000)
        : undefined;

      await Promise.all([
        SecureStore.setItemAsync(StorageKeys.ACCESS_TOKEN, tokens.accessToken),
        SecureStore.setItemAsync(StorageKeys.REFRESH_TOKEN, tokens.refreshToken),
        expiresAt ? SecureStore.setItemAsync(StorageKeys.TOKEN_EXPIRES_AT, expiresAt.toString()) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Retrieve access token from secure storage
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(StorageKeys.ACCESS_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  /**
   * Retrieve refresh token from secure storage
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(StorageKeys.REFRESH_TOKEN);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  /**
   * Get all tokens from storage
   */
  async getTokens(): Promise<AuthTokens | null> {
    try {
      const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
        SecureStore.getItemAsync(StorageKeys.ACCESS_TOKEN),
        SecureStore.getItemAsync(StorageKeys.REFRESH_TOKEN),
        SecureStore.getItemAsync(StorageKeys.TOKEN_EXPIRES_AT),
      ]);

      if (!accessToken || !refreshToken) {
        return null;
      }

      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;

      return {
        accessToken,
        refreshToken,
        expiresAt,
        expiresIn: expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : undefined,
      };
    } catch (error) {
      console.error('Failed to retrieve tokens:', error);
      return null;
    }
  }

  /**
   * Check if access token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const expiresAtStr = await SecureStore.getItemAsync(StorageKeys.TOKEN_EXPIRES_AT);
      if (!expiresAtStr) {
        return false; // If no expiration time is set, assume token is valid
      }

      const expiresAt = parseInt(expiresAtStr, 10);
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      return now >= (expiresAt - bufferTime);
    } catch (error) {
      console.error('Failed to check token expiration:', error);
      return true; // Assume expired on error for security
    }
  }

  /**
   * Store user data
   */
  async setUser(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(StorageKeys.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to store user data:', error);
      throw new Error('Failed to store user data');
    }
  }

  /**
   * Retrieve user data
   */
  async getUser(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(StorageKeys.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return false;
      }

      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        const refreshToken = await this.getRefreshToken();
        return !!refreshToken; // Can potentially refresh
      }

      return true;
    } catch (error) {
      console.error('Failed to check authentication status:', error);
      return false;
    }
  }

  /**
   * Refresh tokens (to be called by API interceptor)
   * Prevents multiple simultaneous refresh attempts
   */
  async refreshTokens(refreshTokenFn: (refreshToken: string) => Promise<AuthTokens>): Promise<AuthTokens | null> {
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh(refreshTokenFn);
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(refreshTokenFn: (refreshToken: string) => Promise<AuthTokens>): Promise<AuthTokens | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const newTokens = await refreshTokenFn(refreshToken);
      await this.setTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      await this.clearSession(); // Clear invalid session
      return null;
    }
  }

  /**
   * Clear all session data
   */
  async clearSession(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(StorageKeys.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(StorageKeys.REFRESH_TOKEN),
        SecureStore.deleteItemAsync(StorageKeys.USER_DATA),
        SecureStore.deleteItemAsync(StorageKeys.TOKEN_EXPIRES_AT),
      ]);
    } catch (error) {
      console.error('Failed to clear session:', error);
      // Don't throw error here as we want logout to succeed even if cleanup fails
    }
  }

  /**
   * Get valid access token, refreshing if necessary
   */
  async getValidAccessToken(refreshTokenFn: (refreshToken: string) => Promise<AuthTokens>): Promise<string | null> {
    try {
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        return null;
      }

      const isExpired = await this.isTokenExpired();
      if (!isExpired) {
        return accessToken;
      }

      // Token is expired, try to refresh
      const newTokens = await this.refreshTokens(refreshTokenFn);
      return newTokens?.accessToken || null;
    } catch (error) {
      console.error('Failed to get valid access token:', error);
      return null;
    }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();

// Export convenience functions
export const {
  setTokens,
  getAccessToken,
  getRefreshToken,
  getTokens,
  isTokenExpired,
  setUser,
  getUser,
  isAuthenticated,
  refreshTokens,
  clearSession,
  getValidAccessToken,
} = sessionManager;