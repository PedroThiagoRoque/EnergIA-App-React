import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig
} from 'axios';
import { sessionManager } from '../auth/session';
import { ApiConfig, ApiError, ApiResponse, AuthTokens, RefreshTokenResponse } from '../types';

/**
 * API client configuration and defaults
 */
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://chatenergia.com.br',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Enhanced Axios instance with automatic token handling, refresh logic, and error handling
 */
class ApiClient {
  private axiosInstance: AxiosInstance;
  private config: ApiConfig;
  private isRefreshing = false;
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(config?: Partial<ApiConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  private setupInterceptors(): void {
    // Request interceptor - Add auth token
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          const token = await sessionManager.getAccessToken();
          const cookie = await sessionManager.getAuthCookie();

          if (config.headers) {
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
            if (cookie) {
              config.headers.Cookie = cookie;
            }
          }
        } catch (error) {
          console.warn('Failed to get access token for request:', error);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor - Handle token refresh on 401
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - Token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.handleTokenRefresh();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch {
            // Refresh failed, clear session and redirect to login
            await sessionManager.clearSession();
            return Promise.reject(this.handleError(error));
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async handleTokenRefresh(): Promise<string | null> {
    // If already refreshing, queue the request
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const newTokens = await sessionManager.refreshTokens(this.refreshTokenRequest.bind(this));

      if (newTokens) {
        // Process queued requests
        this.refreshQueue.forEach(({ resolve }) => {
          resolve(newTokens.accessToken);
        });
        this.refreshQueue = [];
        return newTokens.accessToken;
      }

      throw new Error('Failed to refresh token');
    } catch (error) {
      // Reject all queued requests
      this.refreshQueue.forEach(({ reject }) => {
        reject(error);
      });
      this.refreshQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  private async refreshTokenRequest(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
        `${this.config.baseURL}/auth/refresh`,
        { refreshToken },
        {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success && response.data.data?.tokens) {
        return response.data.data.tokens;
      }

      throw new Error('Invalid refresh token response');
    } catch (error) {
      console.error('Token refresh request failed:', error);
      throw new Error('Failed to refresh authentication token');
    }
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      status: 0,
    };

    if (error.response) {
      // Server responded with error status
      apiError.status = error.response.status;
      apiError.message = this.extractErrorMessage(error.response.data);
      apiError.code = this.getErrorCode(error.response.status);
      apiError.details = error.response.data as Record<string, unknown>;
    } else if (error.request) {
      // Network error
      apiError.message = 'Network error. Please check your connection.';
      apiError.code = 'NETWORK_ERROR';
      apiError.status = 0;
    } else {
      // Request configuration error
      apiError.message = error.message || 'Request configuration error';
      apiError.code = 'REQUEST_ERROR';
    }

    return apiError;
  }

  private extractErrorMessage(data: unknown): string {
    if (typeof data === 'object' && data !== null) {
      const errorData = data as Record<string, unknown>;

      if (typeof errorData.message === 'string') {
        return errorData.message;
      }

      if (typeof errorData.error === 'string') {
        return errorData.error;
      }

      if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        return errorData.errors[0];
      }
    }

    return 'An error occurred';
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMITED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 502:
        return 'BAD_GATEWAY';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      case 504:
        return 'GATEWAY_TIMEOUT';
      default:
        return 'HTTP_ERROR';
    }
  }

  // Public API methods
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // Utility methods
  updateConfig(newConfig: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.axiosInstance.defaults.baseURL = this.config.baseURL;
    this.axiosInstance.defaults.timeout = this.config.timeout;
  }

  getConfig(): ApiConfig {
    return { ...this.config };
  }

  // Direct access to axios instance for advanced use cases
  get axios(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience functions
export const {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  patch: apiPatch,
  delete: apiDelete,
} = apiClient;

// Export class for custom instances if needed
export { ApiClient };

// Export default instance
export default apiClient;