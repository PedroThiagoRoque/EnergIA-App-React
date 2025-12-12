import { useState, useCallback } from 'react';
import { chatService } from '../api/services/chat';
import type { ChatMessage } from '../types';

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  clearMessages: () => void;
  addWelcomeMessage: (userName?: string) => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text.trim(),
      role: 'user',
      timestamp: new Date().toISOString(),
    };

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Enviar mensagem para a API
      const response = await chatService.sendMessage(userMessage.content);

      // Adicionar resposta da IA
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response || 'Resposta não disponível',
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);

      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      setError(errorMessage);

      // Mensagem de erro para o usuário
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        role: 'system',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const addWelcomeMessage = useCallback((userName?: string) => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      content: `Olá${userName ? `, ${userName}` : ''}! Sou a EnergIA, sua assistente de eficiência energética. Como posso te ajudar hoje?`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    addWelcomeMessage,
  };
}