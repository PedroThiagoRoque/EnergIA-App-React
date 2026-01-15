import apiClient from '../axios';
import {
    ApiResponse,
    LoginCredentials,
    RegisterData,
    AuthResponse,
    User
} from '../../types';

export const authService = {
    /**
     * Login user with email and password
     * POST /login
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        console.log('🔐 authService.login: Sending JSON request...');

        const config = apiClient.getConfig();
        const baseUrl = config.baseURL || 'https://chatenergia.com.br';

        try {
            const response = await fetch(`${baseUrl}/api/login`, {
                method: 'POST',
                body: JSON.stringify(credentials),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            console.log('🔍 authService.login status:', response.status);

            if (response.ok) {
                // Extract cookie
                const setCookie = response.headers.get('set-cookie');
                let cookieString = '';
                if (setCookie) {
                    cookieString = setCookie;
                    if (setCookie.includes('connect.sid')) {
                        const match = setCookie.match(/connect\.sid=[^;]+/);
                        if (match) cookieString = match[0];
                    }
                }
                console.log('🍪 authService.login: Cookie:', cookieString);

                const data = await response.json();

                return {
                    tokens: {
                        accessToken: 'session-cookie',
                        refreshToken: '',
                        expiresIn: 3600,
                        cookie: cookieString
                    },
                    user: data.user
                };
            }

            // Handle errors
            let errorMessage = 'Login failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // Ignore JSON parse error, use default message
            }
            throw new Error(errorMessage);

        } catch (error: any) {
            console.error('💥 authService.login error:', error);
            throw new Error(error.message || 'Network request failed');
        }
    },

    /**
     * Register new user
     * POST /api/register
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        console.log('📝 authService.register: Sending JSON request...');

        const config = apiClient.getConfig();
        const baseUrl = config.baseURL || 'https://chatenergia.com.br';

        try {
            const response = await fetch(`${baseUrl}/api/register`, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            console.log('🔍 authService.register status:', response.status);

            if (response.ok || response.status === 201) {
                // Extract cookie (auto-login)
                const setCookie = response.headers.get('set-cookie');
                let cookieString = '';
                if (setCookie) {
                    cookieString = setCookie;
                    if (setCookie.includes('connect.sid')) {
                        const match = setCookie.match(/connect\.sid=[^;]+/);
                        if (match) cookieString = match[0];
                    }
                }
                console.log('🍪 authService.register: Cookie:', cookieString);

                const responseData = await response.json();

                return {
                    tokens: {
                        accessToken: 'session-cookie',
                        refreshToken: '',
                        expiresIn: 3600,
                        cookie: cookieString
                    },
                    user: responseData.user
                };
            }

            // Handle errors
            let errorMessage = 'Registration failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // Ignore
            }
            throw new Error(errorMessage);

        } catch (error: any) {
            console.error('💥 authService.register error:', error);
            throw new Error(error.message || 'Network request failed');
        }
    },

    /**
     * Logout user
     * GET /logout
     */
    async logout(): Promise<void> {
        await apiClient.get('/logout');
    },

    /**
     * Change user password
     * POST /change-password
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        const response = await apiClient.post('/change-password', {
            currentPassword,
            newPassword,
        });
        if (!response.success) {
            throw new Error(response.message || 'Failed to change password');
        }
    },

    /**
     * Request password reset
     * POST /forgot-password
     */
    async forgotPassword(email: string): Promise<void> {
        const response = await apiClient.post('/forgot-password', { email });
        if (!response.success) {
            throw new Error(response.message || 'Failed to request password reset');
        }
    },
};
