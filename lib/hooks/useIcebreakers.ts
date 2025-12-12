import { useState, useEffect, useCallback } from 'react';
import { chatService } from '../api/services/chat';


export interface UseIcebreakersReturn {
  icebreakers: string[];
  dicaDoDia?: string;
  isLoading: boolean;
  error: string | null;
  refreshIcebreakers: () => Promise<void>;
}

export function useIcebreakers(): UseIcebreakersReturn {
  const [icebreakers, setIcebreakers] = useState<string[]>([
    // Inicializar com sugestões locais padrão
    'Iluminação LED por cômodo',
    'Como economizar no ar-condicionado',
    'Chuveiro elétrico vs gás',
    'Aproveitamento de luz natural',
    'Equipamentos com selo Procel'
  ]);
  const [dicaDoDia, setDicaDoDia] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIcebreakers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await chatService.getIcebreakers();

      // Só atualizar se receber dados válidos da API
      if (data.icebreakers && data.icebreakers.length > 0) {
        // Map API response to string array if needed, or update type
        // The new type IcebreakersResponse has icebreakers: Icebreaker[]
        // But the state is string[]
        // Let's assume we map it or if backend returns strings (which it might not per new type)
        // Adjusting to map from Icebreaker[] to string[]
        setIcebreakers(data.icebreakers.map(i => i.text));
        setDicaDoDia(data.dailyTip);
        console.log('✅ Icebreakers da API carregados:', data.icebreakers.length, 'temas');
      } else {
        console.log('⚠️ API retornou dados vazios, mantendo sugestões locais');
      }

    } catch (err) {
      console.error('❌ Erro ao carregar icebreakers:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar sugestões';
      setError(errorMessage);

      // Manter sugestões locais ampliadas em caso de erro
      setIcebreakers([
        'Iluminação LED por cômodo',
        'Como economizar no ar-condicionado',
        'Chuveiro elétrico vs gás',
        'Aproveitamento de luz natural',
        'Equipamentos com selo Procel',
        'Energia solar residencial',
        'Dicas para reduzir a conta de luz',
        'Bandeiras tarifárias no Brasil',
        'Horário de ponta vs fora de ponta',
        'Eficiência energética em casa'
      ]);

      // Definir uma dica local padrão
      setDicaDoDia('💡 Dica: Desligue aparelhos em stand-by para economizar até 10% na conta de luz');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshIcebreakers = useCallback(async () => {
    await loadIcebreakers();
  }, [loadIcebreakers]);

  // Carregar icebreakers automaticamente, mas com delay para evitar problemas de renderização
  useEffect(() => {
    const timer = setTimeout(() => {
      loadIcebreakers();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadIcebreakers]);

  return {
    icebreakers,
    dicaDoDia,
    isLoading,
    error,
    refreshIcebreakers,
  };
}