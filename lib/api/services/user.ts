import apiClient from '../axios';
import { ApiConfig, ApiResponse, User } from '../../types';

export const userService = {
    /**
     * Get user dashboard data
     * GET /dashboard
     */
    async getDashboard(): Promise<User> {
        // The dashboard endpoint might return HTML (browser view) or JSON depending on the client/headers.
        // We need to handle both to be robust.

        try {
            const response = await apiClient.axios.get<User | string>('/dashboard');
            const data = response.data;

            // Case 1: JSON Response
            if (typeof data === 'object' && data !== null && 'email' in data) {
                return data as User;
            }

            // Case 2: HTML Response (Parsing required)
            if (typeof data === 'string') {
                console.log('📄 userService.getDashboard: Received HTML, parsing user data...');
                const html = data;

                let userName = 'Usuário';
                let userEmail = '';

                // Extract Name
                const namePatterns = [
                    /Olá,\s*([^<,!]+)/i,
                    /Hello,\s*([^<,!]+)/i,
                    /Bem-vindo,\s*([^<,!]+)/i,
                    /Welcome,\s*([^<,!]+)/i,
                    /name['"]\s*:\s*['"]([^'"]+)['"]/i, // JS vars check
                    /"user":\s*"([^"]+)"/i
                ];

                for (const pattern of namePatterns) {
                    const match = html.match(pattern);
                    if (match && match[1]) {
                        userName = match[1].trim();
                        break;
                    }
                }

                // Extract Email
                const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (emailMatch) {
                    userEmail = emailMatch[1];
                }

                if (userName !== 'Usuário' || userEmail) {
                    return {
                        id: 'dashboard-extracted', // Mock ID since we can't get it from HTML easily without more parsing
                        name: userName,
                        email: userEmail
                    };
                }

                // Check for Auth failure indicators in HTML
                if (html.includes('login') || html.includes('Login')) {
                    throw new Error('Not authenticated (Redirected to Login)');
                }
            }

            throw new Error('Failed to parse dashboard data');

        } catch (error: any) {
            // Suppress error log for expected auth redirects/failures, just warn
            if (error.message && error.message.includes('Not authenticated')) {
                console.warn('⚠️ userService.getDashboard:', error.message);
            } else {
                console.error('💥 userService.getDashboard error:', error.message);
            }
            throw error;
        }
    },

    /**
     * Get toast notifications
     * GET /api/notifications/toast
     */
    async getToastNotification(): Promise<string> {
        const response = await apiClient.get<{ message: string }>('/api/notifications/toast');
        if (response.data && response.data.message) {
            return response.data.message;
        }
        return '';
    }
};
