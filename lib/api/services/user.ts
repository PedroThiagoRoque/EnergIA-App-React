import apiClient from '../axios';
import { ApiConfig, ApiResponse, User } from '../../types';

export const userService = {
    /**
     * Get user dashboard data
     * GET /dashboard
     */
    async getDashboard(): Promise<User> {
        const response = await apiClient.get<User>('/dashboard');
        if (!response.success && !response.data) {
            throw new Error(response.message || 'Failed to fetch dashboard data');
        }
        return response.data as User;
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
