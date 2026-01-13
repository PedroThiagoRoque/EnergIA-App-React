import apiClient from '../axios';
import { ApiConfig, ApiResponse, User, NotificationResponse } from '../../types';

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

                // Extract UserID and Group from hidden metadata (New Backend feature)
                // <div id="user-metadata" style="display:none;" data-userid="<%= userId %>" data-group="<%= group %>"></div>
                let userId = 'dashboard-extracted';
                let userGroup: 'Watts' | 'Volts' = 'Watts';

                const metaMatch = html.match(/data-userid=["']([^"']+)["']/);
                const groupMatch = html.match(/data-group=["'](Watts|Volts)["']/i);

                if (metaMatch && metaMatch[1]) {
                    userId = metaMatch[1];
                    console.log('✅ userService: Extracted Real UserID:', userId);
                }

                if (groupMatch && groupMatch[1]) {
                    userGroup = groupMatch[1] as 'Watts' | 'Volts';
                    console.log('✅ userService: Extracted Group:', userGroup);
                } else {
                    // Fallback heuristic
                    if (html.includes('dashboard_gen') || html.includes('Visualização Genérica')) {
                        console.log('⚠️ userService: Group fallback heuristic triggered (Volts)');
                        userGroup = 'Volts';
                    } else {
                        console.log('⚠️ userService: No group found, defaulting to Watts');
                    }
                }

                // Extract Email
                const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
                if (emailMatch) {
                    userEmail = emailMatch[1];
                }

                console.log('🔍 userService: Final Parsed User:', { userId, userName, userGroup });

                if (userName !== 'Usuário' || userEmail) {
                    return {
                        id: userId,
                        name: userName,
                        email: userEmail,
                        group: userGroup
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
    },

    /**
     * Get targeted notification for the user based on group
     * GET /api/notification?userId={userId}
     */
    async getNotification(userId: string): Promise<string> {
        try {
            const response = await apiClient.get<NotificationResponse>(`/api/notification?userId=${userId}`);
            if (response.data && response.data.notification) {
                return response.data.notification;
            }
            return '';
        } catch (error: any) {
            // Silence 404s as they are expected if backend is not fully updated
            if (error.status === 404 || (error.response && error.response.status === 404)) {
                console.log('ℹ️ Notification API not available (404), using local fallback.');
                return '';
            }
            console.warn('Failed to fetch notification:', error.message || error);
            return '';
        }
    }
};
