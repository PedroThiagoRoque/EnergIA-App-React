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
        // Encode as form data for legacy backend compatibility
        const params = new URLSearchParams();
        params.append('email', credentials.email);
        params.append('password', credentials.password);

        // Use raw axios instance to get headers
        const response = await apiClient.axios.post<any>('/login', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('🔍 authService.login headers:', JSON.stringify(response.headers, null, 2));

        const responseData = response.data;

        // Success criteria: JSON success OR HTML containing dashboard indicators
        if (typeof responseData === 'string' &&
            (responseData.includes('Dashboard') || responseData.includes('Olá,'))) {

            // Extract user name from greeting
            const match = responseData.match(/Olá,\s+([^!]+)!/);
            const name = match ? match[1] : 'Usuário';

            // Extract cookie from response.headers['set-cookie'] and store it
            let cookieString = '';
            const setCookie = response.headers['set-cookie'];
            if (setCookie) {
                if (Array.isArray(setCookie)) {
                    const sidCookie = setCookie.find(c => c.includes('connect.sid'));
                    cookieString = sidCookie ? sidCookie.split(';')[0] : setCookie[0].split(';')[0];
                } else if (typeof setCookie === 'string') {
                    cookieString = (setCookie as string).split(';')[0];
                }
            }

            return {
                tokens: {
                    accessToken: 'session-cookie',
                    refreshToken: '',
                    expiresIn: 3600,
                    cookie: cookieString
                },
                user: {
                    id: '1',
                    email: credentials.email,
                    name: name
                }
            };
        }

        if (responseData.success) {
            return responseData.data as AuthResponse;
        }

        throw new Error('Login failed');
    },

    /**
     * Register new user
     * POST /register
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/register', data);
        if (!response.success && !response.data) {
            throw new Error(response.message || 'Registration failed');
        }
        return response.data as AuthResponse;
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
