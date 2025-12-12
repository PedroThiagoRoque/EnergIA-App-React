import apiClient from '../axios';
import { EditorPrompt, EditorResponse } from '../../types';

export const editorService = {
    /**
     * Process prompt with OpenAI
     * POST /editor/openai
     */
    async processOpenAI(promptData: EditorPrompt): Promise<EditorResponse> {
        const response = await apiClient.post<EditorResponse>('/editor/openai', promptData);
        if (!response.success && !response.data) {
            throw new Error(response.message || 'OpenAI processing failed');
        }
        return response.data as EditorResponse;
    },

    /**
     * Process prompt with Bedrock
     * POST /editor/bedrock
     */
    async processBedrock(promptData: EditorPrompt): Promise<EditorResponse> {
        const response = await apiClient.post<EditorResponse>('/editor/bedrock', promptData);
        if (!response.success && !response.data) {
            throw new Error(response.message || 'Bedrock processing failed');
        }
        return response.data as EditorResponse;
    }
};
