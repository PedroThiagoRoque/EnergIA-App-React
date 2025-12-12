import apiClient from '../axios';
import { AdminStats, ApiResponse } from '../../types';

export const adminService = {
    /**
     * Get admin stats
     * GET /admin
     */
    async getStats(): Promise<AdminStats> {
        const response = await apiClient.get<AdminStats>('/admin');
        if (!response.success && !response.data) {
            throw new Error(response.message || 'Failed to fetch admin stats');
        }
        return response.data as AdminStats;
    },

    /**
     * Reset user password
     * POST /admin/reset-password
     */
    async resetUserPassword(userId: string): Promise<void> {
        const response = await apiClient.post('/admin/reset-password', { userId });
        if (!response.success) {
            throw new Error(response.message || 'Failed to reset password');
        }
    }
};
