import { useState, useCallback } from 'react';
import { sendChatMessage } from '../api/energia';
import type { ChatMessage, ChatResponse } from '../types';

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
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    // Adicionar mensagem do usuário
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Enviar mensagem para a API
      const response: ChatResponse = await sendChatMessage(userMessage.text);

      // Adicionar resposta da IA
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        isUser: false,
        timestamp: new Date(),
        assistantType: response.assistantType,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro de conexão';
      setError(errorMessage);

      // Mensagem de erro para o usuário
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        isUser: false,
        timestamp: new Date(),
        assistantType: 'Sistema',
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
      text: `Olá${userName ? `, ${userName}` : ''}! Sou a EnergIA, sua assistente de eficiência energética. Como posso te ajudar hoje?`,
      isUser: false,
      timestamp: new Date(),
      assistantType: 'EnergIA',
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