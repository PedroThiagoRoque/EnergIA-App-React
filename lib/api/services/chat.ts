import apiClient from '../axios';
import {
    ApiResponse,
    ChatMessage,
    ChatResponse,
    IcebreakersResponse
} from '../../types';

export const chatService = {
    /**
     * Get chat history
     * GET /chat
     */
    async getHistory(): Promise<ChatMessage[]> {
        const response = await apiClient.get<ChatMessage[]>('/chat');
        return response.data || [];
    },

    /**
     * Send a new message to the chat
     * POST /chat/message
     */
    async sendMessage(message: string): Promise<ChatResponse> {
        try {
            const response = await apiClient.post<any>('/chat/message', { message });

            // Handle SSE/Stream response format (Direct string response)
            if (typeof response === 'string' && response.includes('data:')) {
                const fullText = parseSSEResponse(response);
                return {
                    response: fullText,
                    assistantType: 'EnergIA'
                };
            }

            // Handle wrapped SSE response (just in case)
            if (response && response.data && typeof response.data === 'string' && response.data.includes('data:')) {
                const fullText = parseSSEResponse(response.data);
                return {
                    response: fullText,
                    assistantType: 'EnergIA'
                };
            }

            if (!response.success && !response.data) {
                // If the response is the direct chat response (legacy API style), handle it
                if ((response as any).response) {
                    return response as any as ChatResponse;
                }
                throw new Error(response.message || 'Failed to send message');
            }
            return response.data as ChatResponse;
        } catch (error: any) {
            console.error('🔍 chatService.sendMessage error:', error.message);
            throw error;
        }
    },

    /**
     * Check if chat service is healthy
     * GET /chat/health
     */
    async getHealth(): Promise<boolean> {
        try {
            const response = await apiClient.get<{ status: string }>('/chat/health');
            return response.success;
        } catch {
            return false;
        }
    },

    /**
     * Get daily icebreakers
     * GET /chat/daily/icebreakers
     */
    async getIcebreakers(): Promise<IcebreakersResponse> {
        try {
            const response = await apiClient.get<IcebreakersResponse>('/chat/daily/icebreakers');
            if (response.success && response.data) {
                return response.data as IcebreakersResponse;
            }
        } catch (error) {
            console.warn('Failed to fetch icebreakers, using local fallback:', error);
        }

        // Return local fallback to keep app functional
        return {
            icebreakers: [
                { id: '1', text: 'Como posso economizar energia no ar condicionado?' },
                { id: '2', text: 'Quais aparelhos gastam mais energia em casa?' },
                { id: '3', text: 'Dicas para iluminação eficiente' },
                { id: '4', text: 'Entendendo a bandeira tarifária' }
            ],
            dailyTip: 'Desligue aparelhos da tomada quando não estiverem em uso para evitar o consumo \"vampiro\".'
        };
    }
};

/**
 * Helper to parse SSE format string 
 * e.g. data: {"chunk":"Hello"}\n\ndata: {"chunk":" World"}
 */
function parseSSEResponse(sseString: string): string {
    try {
        const lines = sseString.split('\n');
        let fullMessage = '';

        for (const line of lines) {
            if (line.trim().startsWith('data:')) {
                const jsonStr = line.replace('data:', '').trim();
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);
                    if (data.chunk) {
                        fullMessage += data.chunk;
                    }
                } catch (e) {
                    // Ignore parse errors for individual lines (e.g. keep-alives or malformed)
                }
            }
        }
        return fullMessage;
    } catch (error) {
        console.error('Failed to parse SSE response:', error);
        return 'Erro ao processar resposta do servidor.';
    }
}
