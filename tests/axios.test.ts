import { ApiClient, apiClient } from '../lib/api/axios';
import { ApiConfig } from '../lib/types';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    defaults: {
      baseURL: '',
      timeout: 0,
    },
  })),
  post: jest.fn(),
}));

// Mock session manager
jest.mock('../lib/auth/session', () => ({
  sessionManager: {
    getAccessToken: jest.fn(),
    refreshTokens: jest.fn(),
    clearSession: jest.fn(),
  },
}));

describe('ApiClient', () => {
  const mockConfig: ApiConfig = {
    baseURL: 'https://api.test.com',
    timeout: 5000,
    retryAttempts: 2,
    retryDelay: 500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create axios instance with default config', () => {
      const client = new ApiClient();
      expect(client).toBeInstanceOf(ApiClient);
    });

    it('should create axios instance with custom config', () => {
      const client = new ApiClient(mockConfig);
      expect(client).toBeInstanceOf(ApiClient);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      const client = new ApiClient();
      const newConfig = { baseURL: 'https://new-api.com' };
      
      client.updateConfig(newConfig);
      const config = client.getConfig();
      
      expect(config.baseURL).toBe(newConfig.baseURL);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const client = new ApiClient(mockConfig);
      const config = client.getConfig();
      
      expect(config).toEqual(expect.objectContaining(mockConfig));
    });
  });

  describe('singleton instance', () => {
    it('should export default apiClient instance', () => {
      expect(apiClient).toBeInstanceOf(ApiClient);
    });

    it('should provide convenience methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });
  });

  describe('error handling', () => {
    it('should handle network errors', () => {
      const client = new ApiClient();
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      // Test error handling logic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (client as any).handleError(mockError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.message).toBe('Network error. Please check your connection.');
    });

    it('should handle server errors', () => {
      const client = new ApiClient();
      const mockError = {
        response: {
          status: 500,
          data: { message: 'Internal Server Error' },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = (client as any).handleError(mockError);
      expect(error.code).toBe('INTERNAL_SERVER_ERROR');
      expect(error.status).toBe(500);
      expect(error.message).toBe('Internal Server Error');
    });

    it('should extract error messages correctly', () => {
      const client = new ApiClient();
      
      // Test with message field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let message = (client as any).extractErrorMessage({ message: 'Custom error' });
      expect(message).toBe('Custom error');
      
      // Test with error field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message = (client as any).extractErrorMessage({ error: 'Error message' });
      expect(message).toBe('Error message');
      
      // Test with errors array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message = (client as any).extractErrorMessage({ errors: ['First error', 'Second error'] });
      expect(message).toBe('First error');
      
      // Test with unknown format
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      message = (client as any).extractErrorMessage({ unknown: 'field' });
      expect(message).toBe('An error occurred');
    });
  });

  describe('getErrorCode', () => {
    it('should return correct error codes for HTTP status', () => {
      const client = new ApiClient();
      
      /* eslint-disable @typescript-eslint/no-explicit-any */
      expect((client as any).getErrorCode(400)).toBe('BAD_REQUEST');
      expect((client as any).getErrorCode(401)).toBe('UNAUTHORIZED');
      expect((client as any).getErrorCode(403)).toBe('FORBIDDEN');
      expect((client as any).getErrorCode(404)).toBe('NOT_FOUND');
      expect((client as any).getErrorCode(422)).toBe('VALIDATION_ERROR');
      expect((client as any).getErrorCode(429)).toBe('RATE_LIMITED');
      expect((client as any).getErrorCode(500)).toBe('INTERNAL_SERVER_ERROR');
      expect((client as any).getErrorCode(502)).toBe('BAD_GATEWAY');
      expect((client as any).getErrorCode(503)).toBe('SERVICE_UNAVAILABLE');
      expect((client as any).getErrorCode(504)).toBe('GATEWAY_TIMEOUT');
      expect((client as any).getErrorCode(999)).toBe('HTTP_ERROR');
      /* eslint-enable @typescript-eslint/no-explicit-any */
    });
  });
});