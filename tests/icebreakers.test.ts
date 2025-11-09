// Teste simples para validar a funcionalidade dos icebreakers
import { getDailyIcebreakers } from '../lib/api/energia';

// Simular teste local sem chamada de API (para desenvolvimento)
export async function testIcebreakersLocal() {
  console.log('🧪 Testando icebreakers localmente...');
  
  // Dados simulados que a API retornaria
  const mockResponse = {
    temas: [
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
    ],
    dicaDoDia: '💡 Dica: Desligue aparelhos em stand-by para economizar até 10% na conta de luz',
    geradoEm: new Date().toISOString()
  };
  
  console.log('✅ Icebreakers mock:', mockResponse);
  return mockResponse;
}

// Teste real da API (requer autenticação)
export async function testIcebreakersAPI() {
  console.log('🌐 Testando icebreakers da API...');
  
  try {
    const response = await getDailyIcebreakers();
    console.log('✅ Resposta da API:', response);
    return response;
  } catch (error) {
    console.error('❌ Erro na API:', error);
    throw error;
  }
}

export default {
  testLocal: testIcebreakersLocal,
  testAPI: testIcebreakersAPI
};