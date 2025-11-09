import { useState, useEffect, useCallback } from 'react';
import { getDailyIcebreakers } from '../api/energia';
import { checkAuth } from '../api/energia';
import type { IcebreakersResponse } from '../types';

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
      
      // Verificar autenticação primeiro
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        console.log('⚠️ Usuário não autenticado, usando sugestões locais');
        setError('Faça login para ver sugestões personalizadas');
        return; // Manter sugestões locais padrão
      }
      
      const data = await getDailyIcebreakers();
      
      // Só atualizar se receber dados válidos da API
      if (data.temas && data.temas.length > 0) {
        setIcebreakers(data.temas);
        setDicaDoDia(data.dicaDoDia);
        console.log('✅ Icebreakers da API carregados:', data.temas.length, 'temas');
        console.log('🎯 Temas recebidos:', data.temas);
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