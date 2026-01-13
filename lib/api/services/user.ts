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
                const { parseUserFromDashboardHtml } = await import('../../utils/htmlParser');
                const { user, isAuthenticated } = parseUserFromDashboardHtml(data);

                if (isAuthenticated && user) {
                    return user;
                }

                throw new Error('Not authenticated (Redirected to Login)');
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
    },

    /**
     * Get daily toasts for scheduling
     * GET /api/notification/toasts
     */
    async getDailyToasts(): Promise<string[]> {
        try {
            const response = await apiClient.get<{ toasts: string[] }>('/api/notification/toasts');
            if (response.data && Array.isArray(response.data.toasts)) {
                return response.data.toasts;
            }
            return [];
        } catch (error: any) {
            console.warn('Failed to fetch daily toasts:', error.message || error);
            return [];
        }
    }
};
