/**
 * Script de teste para validar login da API EnergIA
 * Execute este script para testar rapidamente se as credenciais funcionam
 */

const testLogin = async (email, password) => {
  console.log('🧪 Testando login para:', email);
  
  try {
    // 1. Fazer login
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    console.log('📤 Enviando POST /login...');
    const loginResponse = await fetch('https://chatenergia.com.br/login', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    console.log('📥 Login response:', loginResponse.status, loginResponse.statusText);

    // 2. Testar dashboard
    console.log('🔍 Testando /dashboard...');
    const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
    });

    console.log('📋 Dashboard response:', dashboardResponse.status, dashboardResponse.statusText);

    if (dashboardResponse.ok) {
      const html = await dashboardResponse.text();
      
      const hasPasswordField = html.includes('type="password"');
      const hasLogout = html.toLowerCase().includes('logout');
      const hasDashboard = html.toLowerCase().includes('dashboard');
      
      console.log('📄 Análise do HTML:');
      console.log('  - Tem campo senha?', hasPasswordField);
      console.log('  - Tem logout?', hasLogout);
      console.log('  - Tem dashboard?', hasDashboard);
      
      const success = !hasPasswordField && (hasLogout || hasDashboard);
      
      console.log(success ? '✅ LOGIN SUCESSO' : '❌ LOGIN FALHOU');
      return success;
    } else {
      console.log('❌ Dashboard não acessível');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
    return false;
  }
};

// Para usar no console do browser:
// testLogin('seu@email.com', 'suasenha');

// Para React Native, exporte a função:
export { testLogin };