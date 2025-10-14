// Script simples para testar a extração do nome
const htmlMock = `
<div class="greeting">Olá,<br><h3> Pedro Silva!</h3></div>
`;

function extractUserName(html) {
  console.log('🔍 Extraindo nome do usuário...');
  
  try {
    // Padrão principal usado no site
    const greetingPattern = /Olá,\s*<br><h3>\s*([^<]+)!/i;
    let match = html.match(greetingPattern);
    
    if (match && match[1]) {
      const name = match[1].trim();
      console.log('✅ Nome encontrado:', name);
      return name;
    }

    console.log('❌ Nome não encontrado');
    return null;
  } catch (error) {
    console.error('💥 Erro na extração:', error);
    return null;
  }
}

// Teste
const resultado = extractUserName(htmlMock);
console.log('Resultado final:', resultado);