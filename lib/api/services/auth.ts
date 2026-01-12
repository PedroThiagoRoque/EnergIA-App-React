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
        // Use URLSearchParams for standard x-www-form-urlencoded submission
        // This is more likely to be supported by the backend than FormData if Multer is not configured for /login
        const params = new URLSearchParams();
        params.append('email', credentials.email);
        params.append('password', credentials.password);

        console.log('🔐 authService.login: Sending URLSearchParams request via fetch...');

        const config = apiClient.getConfig();
        const baseUrl = config.baseURL || 'https://chatenergia.com.br';

        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: 'POST',
                body: params.toString(), // Send as string
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                credentials: 'include',
                redirect: 'manual',
            });

            console.log('🔍 authService.login status:', response.status);

            // Handle Redirection (301/302) or Success (200)
            const isRedirect = response.status === 301 || response.status === 302;
            const isSuccess = response.ok || isRedirect;

            if (isSuccess) {
                // Extract cookie from response headers
                const setCookie = response.headers.get('set-cookie');
                let cookieString = '';

                if (setCookie) {
                    // Fetch headers.get combines multiple set-cookie values differently depending on implementation,
                    // but usually we just look for connect.sid
                    cookieString = setCookie;
                    // Simple extraction if multiple cookies are joined by comma (common in some fetch polyfills, though RN android might differ)
                    if (setCookie.includes('connect.sid')) {
                        const match = setCookie.match(/connect\.sid=[^;]+/);
                        if (match) cookieString = match[0];
                    }
                }

                // If it was a redirect, the body is likely empty or simple text
                // If 200, it might be the dashboard HTML or JSON
                const responseText = await response.text();
                // console.log('📄 authService.login: Body length:', responseText.length); // Too noisy if HTML
                console.log('🍪 authService.login: Cookie:', cookieString);

                // Try to parse as JSON first (API might return JSON {success: true} for 200 OK)
                try {
                    // Check if it looks like JSON to avoid trying to parse huge HTML
                    if (responseText.trim().startsWith('{')) {
                        const json = JSON.parse(responseText);
                        console.log('🔍 authService.login: Parsed JSON:', JSON.stringify(json).substring(0, 100)); // Log start

                        if (json.success || json.user) {
                            console.log('✅ authService.login: JSON success detected');

                            // Try to get user from JSON, or fallback
                            const user = json.data?.user || json.user || { id: '1', email: credentials.email, name: 'Usuário' };

                            return {
                                tokens: json.data?.tokens || {
                                    accessToken: 'session-cookie',
                                    refreshToken: '',
                                    expiresIn: 3600,
                                    cookie: cookieString
                                },
                                user: user
                            };
                        }
                    }
                } catch (e) {
                    // Not JSON, continue to HTML check
                    console.log('⚠️ authService.login: JSON parse failed, assuming HTML');
                }

                // Extract name if possible (from Dashboard HTML)
                let name = 'Usuário';
                const hasGreeting = responseText.includes('Olá,') || responseText.includes('Bem-vindo');

                if (responseText.includes('Olá,')) {
                    const match = responseText.match(/Olá,\s+([^!]+)!/);
                    if (match) name = match[1];
                }

                // If we got a redirect/success, assume we are logged in
                // especially if we got a connect.sid cookie or valid redirect/greeting
                const hasSession = cookieString.includes('connect.sid');
                const validRedirect = isRedirect && response.headers.get('location');
                const isDashboard = responseText.includes('Dashboard') || hasGreeting;

                if (hasSession || validRedirect || isDashboard) {
                    return {
                        tokens: {
                            accessToken: 'session-cookie', // Mock, we rely on cookie
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

                console.log('❌ authService.login: Validation failed. HasSession:', hasSession, 'IsDashboard:', isDashboard, 'HasGreeting:', hasGreeting);
                if (responseText.length < 2000) {
                    console.log('📄 Body (first 2000 chars):', responseText);
                } else {
                    console.log('📄 Body (first 2000 chars):', responseText.substring(0, 2000));
                }
            }

            throw new Error('Login failed: Invalid response');

        } catch (error: any) {
            console.error('💥 authService.login fetch error:', error);
            throw new Error(error.message || 'Network request failed');
        }
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
