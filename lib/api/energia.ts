import { apiClient } from './axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  redirect?: string;
}

/**
 * Login alternativo com headers mais explícitos
 */
export async function loginUserAlternative(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('🔐 Tentativa alternativa de login para:', credentials.email);
  
  try {
    // Tentar com URLSearchParams ao invés de FormData
    const params = new URLSearchParams();
    params.append('email', credentials.email);
    params.append('password', credentials.password);

    console.log('📤 Enviando requisição alternativa...');

    const response = await fetch('https://chatenergia.com.br/login', {
      method: 'POST',
      body: params,
      credentials: 'include',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'EnergIA-Mobile-App'
      },
    });

    console.log('📥 Resposta alternativa:', {
      status: response.status,
      statusText: response.statusText
    });

    debugCookies(response);

    // Testar dashboard imediatamente
    const dashboardTest = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual'
    });

    if (dashboardTest.ok) {
      const content = await dashboardTest.text();
      if (content.includes('dashboard') || content.includes('logout')) {
        console.log('✅ Login alternativo bem-sucedido');
        return { success: true, redirect: '/dashboard' };
      }
    }

    console.log('❌ Login alternativo falhou');
    return { success: false };

  } catch (error) {
    console.error('💥 Erro no login alternativo:', error);
    throw new Error('Erro de conexão no método alternativo');
  }
}

/**
 * Login usando FormData conforme esperado pela API EnergIA
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('🔐 Iniciando login para:', credentials.email);
  
  try {
    // Criar FormData conforme documentação da API
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);

    console.log('📤 Enviando requisição de login...');

    // Fazer requisição usando fetch diretamente para melhor controle do FormData
    const response = await fetch('https://chatenergia.com.br/login', {
      method: 'POST',
      body: formData,
      credentials: 'include', // Importante para incluir cookies de sessão
      redirect: 'manual', // Interceptar redirecionamentos manualmente
      headers: {
        // Não definir Content-Type para deixar o browser definir o boundary do FormData
      },
    });

    console.log('📥 Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      redirected: response.redirected
    });

    // Debug dos cookies
    debugCookies(response);

    // Verificar se houve redirecionamento (login bem-sucedido)
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      console.log('✅ Login bem-sucedido! Redirecionando para:', location);
      
      return {
        success: true,
        redirect: location || '/dashboard'
      };
    }

    // A API pode retornar 200 mesmo após login bem-sucedido
    // Vamos testar acesso ao dashboard para confirmar se o login funcionou
    console.log('🔍 Testando acesso ao dashboard para verificar se login foi bem-sucedido...');
    
    try {
      const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
        method: 'GET',
        credentials: 'include', // Usar os cookies definidos pelo login
        redirect: 'manual'
      });

      console.log('� Resposta do dashboard:', {
        status: dashboardResponse.status,
        statusText: dashboardResponse.statusText,
        url: dashboardResponse.url
      });

      // Se conseguir acessar o dashboard (200) ou não for redirecionado para login
      if (dashboardResponse.status === 200) {
        const dashboardContent = await dashboardResponse.text();
        
        // Verificar se é realmente a página do dashboard
        if (dashboardContent.includes('dashboard') || dashboardContent.includes('Dashboard') ||
            dashboardContent.includes('logout') || dashboardContent.includes('Logout') ||
            dashboardContent.includes('Bem-vindo') || dashboardContent.includes('Welcome')) {
          console.log('✅ Login bem-sucedido - acesso ao dashboard confirmado');
          return {
            success: true,
            redirect: '/dashboard'
          };
        }
      }

      // Se foi redirecionado para login, o login falhou
      if (dashboardResponse.status === 302 || dashboardResponse.status === 301) {
        const location = dashboardResponse.headers.get('location');
        if (location && (location.includes('login') || location.includes('Login'))) {
          console.log('❌ Login falhou - redirecionado para login ao tentar acessar dashboard');
          return {
            success: false
          };
        }
      }

    } catch (dashboardError) {
      console.error('⚠️ Erro ao testar dashboard:', dashboardError);
    }

    // Caso padrão - assumir falha se não confirmou sucesso
    console.log('❌ Login falhou - não foi possível confirmar sucesso');
    return {
      success: false
    };
    
  } catch (error) {
    console.error('💥 Erro na requisição de login:', error);
    throw new Error('Erro de conexão. Verifique sua internet.');
  }
}

/**
 * Verificar se o usuário está autenticado fazendo uma requisição para o dashboard
 */
export async function checkAuth(): Promise<boolean> {
  console.log('🔍 Verificando autenticação...');
  
  try {
    const response = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include', // Incluir cookies de sessão
      redirect: 'manual', // Interceptar redirecionamentos
    });

    console.log('📥 Resposta da verificação de auth:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    // Se for redirecionado para login, não está autenticado
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get('location');
      if (location && (location.includes('login') || location.includes('Login'))) {
        console.log('❌ Não autenticado - redirecionado para login');
        return false;
      }
    }

    // Se conseguir acessar o dashboard (status 200), está autenticado
    if (response.ok) {
      const content = await response.text();
      console.log('📄 Conteúdo do dashboard (primeiros 300 chars):', content.substring(0, 300));
      
      if (content.includes('dashboard') || content.includes('Dashboard') ||
          content.includes('logout') || content.includes('Logout') ||
          content.includes('Bem-vindo') || content.includes('Welcome') ||
          content.includes('EnergIA') && !content.includes('Login')) {
        console.log('✅ Usuário autenticado');
        return true;
      } else {
        console.log('⚠️ Página dashboard acessível, mas conteúdo não identificado como dashboard');
      }
    }

    console.log('❌ Usuário não autenticado');
    return false;
  } catch (error) {
    console.error('💥 Erro na verificação de auth:', error);
    return false;
  }
}

/**
 * Fazer logout
 */
/**
 * Fazer logout
 */
export async function logoutUser(): Promise<boolean> {
  console.log('🚪 Fazendo logout...');
  
  try {
    const response = await fetch('https://chatenergia.com.br/logout', {
      method: 'GET',
      credentials: 'include',
    });

    console.log('📥 Resposta do logout:', {
      status: response.status,
      statusText: response.statusText
    });

    const success = response.ok || response.status === 302;
    console.log(success ? '✅ Logout bem-sucedido' : '❌ Falha no logout');
    return success;
  } catch (error) {
    console.error('💥 Erro no logout:', error);
    return false;
  }
}

/**
 * Debug dos cookies recebidos
 */
function debugCookies(response: Response) {
  const cookies = response.headers.get('set-cookie');
  if (cookies) {
    console.log('🍪 Cookies recebidos:', cookies);
  } else {
    console.log('🍪 Nenhum cookie recebido');
  }
}

/**
 * Testar conectividade com a API
 */
export async function testApiConnection(): Promise<{connected: boolean, message: string}> {
  console.log('🔗 Testando conectividade com a API...');
  
  try {
    const response = await fetch('https://chatenergia.com.br/', {
      method: 'GET',
    });

    console.log('📥 Resposta do teste de conectividade:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url
    });

    if (response.ok) {
      const content = await response.text();
      console.log('✅ API conectada com sucesso');
      return {
        connected: true,
        message: 'Conectado com sucesso à API'
      };
    } else {
      console.log('⚠️ API respondeu com erro:', response.status);
      return {
        connected: false,
        message: `API respondeu com status ${response.status}`
      };
    }
  } catch (error) {
    console.error('💥 Erro ao conectar com a API:', error);
    return {
      connected: false,
      message: `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

/**
 * Obter dados do usuário do dashboard (para extrair informações básicas)
 */
export async function getUserData(): Promise<any> {
  console.log('👤 Obtendo dados do usuário...');
  
  try {
    const response = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
    });

    console.log('📥 Resposta dos dados do usuário:', {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      const html = await response.text();
      console.log('📄 HTML do dashboard recebido (primeiros 200 chars):', html.substring(0, 200));
      
      // Tentar extrair nome do usuário do HTML
      let userName = 'Usuário';
      let userEmail = '';
      
      // Procurar por padrões comuns de nome de usuário no HTML
      const namePatterns = [
        /Olá,\s*([^<,]+)/i,
        /Hello,\s*([^<,]+)/i,
        /Bem-vindo,\s*([^<,]+)/i,
        /Welcome,\s*([^<,]+)/i,
        /name['"]\s*:\s*['"]([^'"]+)['"]/i,
        /"user":\s*"([^"]+)"/i
      ];
      
      for (const pattern of namePatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          userName = match[1].trim();
          console.log('👤 Nome do usuário extraído:', userName);
          break;
        }
      }
      
      // Procurar por email no HTML
      const emailMatch = html.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        userEmail = emailMatch[1];
        console.log('📧 Email do usuário extraído:', userEmail);
      }

      const userData = {
        name: userName,
        email: userEmail,
      };
      
      console.log('✅ Dados do usuário:', userData);
      return userData;
    }

    console.log('❌ Não foi possível obter dados do usuário');
    return null;
  } catch (error) {
    console.error('💥 Erro ao obter dados do usuário:', error);
    return null;
  }
}

// Interfaces para o Chat
export interface ChatMessage {
  message: string;
}

export interface ChatResponse {
  response: string;
  assistantType: string;
}

/**
 * Enviar mensagem para o chat da IA
 */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  console.log('💬 Enviando mensagem para o chat:', message);

  try {
    const response = await fetch('https://chatenergia.com.br/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
      credentials: 'include', // Importante para autenticação
    });

    console.log('📥 Resposta do chat:', {
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }
      throw new Error(`Erro na API: ${response.status} - ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();
    console.log('✅ Resposta do chat recebida:', data);
    
    return data;
  } catch (error) {
    console.error('💥 Erro ao enviar mensagem para o chat:', error);
    throw error instanceof Error ? error : new Error('Erro de conexão');
  }
}
