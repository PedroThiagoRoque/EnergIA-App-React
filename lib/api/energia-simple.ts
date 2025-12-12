/**
 * @deprecated Use lib/api/services instead.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  redirect?: string;
}

/**
 * Login simples e confiável - versão unificada
 */
export async function loginUserSimple(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('🎯 [SIMPLE] Login direto para:', credentials.email);

  try {
    // Usar URLSearchParams que é o método mais compatível
    const params = new URLSearchParams();
    params.append('email', credentials.email);
    params.append('password', credentials.password);

    const response = await fetch('https://chatenergia.com.br/login', {
      method: 'POST',
      body: params,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; EnergIA-App/1.0)'
      },
    });

    console.log('📥 [SIMPLE] Response:', response.status, response.ok);

    // Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se login foi bem-sucedido
    const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
    });

    if (dashboardResponse.ok) {
      const html = await dashboardResponse.text();

      // Múltiplas verificações para detectar se está logado
      const hasPasswordField = html.includes('type="password"') || html.includes('name="password"');
      const hasLoginForm = html.toLowerCase().includes('login') && hasPasswordField;
      const hasLogout = html.toLowerCase().includes('logout') || html.toLowerCase().includes('sair');
      const hasDashboard = html.toLowerCase().includes('dashboard') || html.toLowerCase().includes('bem-vindo');

      console.log('🔍 [SIMPLE] Análise:', { hasPasswordField, hasLoginForm, hasLogout, hasDashboard });

      // Se não tem formulário de login OU tem elementos de dashboard/logout, está logado
      if (!hasLoginForm || hasLogout || hasDashboard) {
        console.log('✅ [SIMPLE] Login bem-sucedido!');
        return { success: true, redirect: '/dashboard' };
      }
    }

    console.log('❌ [SIMPLE] Login falhou');
    return { success: false };

  } catch (error) {
    console.error('💥 [SIMPLE] Erro:', error);
    return { success: false };
  }
}

/**
 * Login com diagnóstico completo
 */
export async function loginUser(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('🔐 [DIAG] Iniciando login para:', credentials.email);

  try {
    // 1. Testar conectividade básica primeiro  
    console.log('🌐 [DIAG] Testando conectividade com servidor...');
    const pingResponse = await fetch('https://chatenergia.com.br/', {
      method: 'GET',
    });
    console.log('🌐 [DIAG] Servidor responde:', pingResponse.ok, pingResponse.status);

    // 2. Verificar página de login
    console.log('📄 [DIAG] Acessando página de login...');
    const loginPageResponse = await fetch('https://chatenergia.com.br/login', {
      method: 'GET',
      credentials: 'include',
    });
    console.log('📄 [DIAG] Página login:', loginPageResponse.ok, loginPageResponse.status);

    // 3. Fazer POST de login com análise da resposta
    const formData = new FormData();
    formData.append('email', credentials.email);
    formData.append('password', credentials.password);

    console.log('📤 [DIAG] Enviando credenciais...');
    console.log('📤 [DIAG] Email:', credentials.email);
    console.log('📤 [DIAG] Password length:', credentials.password.length);

    const loginResponse = await fetch('https://chatenergia.com.br/login', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      },
    });

    console.log('📥 [DIAG] Resposta POST login:', {
      status: loginResponse.status,
      statusText: loginResponse.statusText,
      ok: loginResponse.ok,
      redirected: loginResponse.redirected,
      url: loginResponse.url
    });

    // Analisar cookies recebidos
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🍪 [DIAG] Cookies recebidos:', setCookieHeader || 'Nenhum');

    // 4. Analisar conteúdo da resposta do POST
    const loginResponseText = await loginResponse.text();
    console.log('📄 [DIAG] POST response length:', loginResponseText.length);
    console.log('📄 [DIAG] POST response sample:', loginResponseText.substring(0, 300));

    // 5. Aguardar e testar dashboard
    console.log('⏱️ [DIAG] Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🔍 [DIAG] Testando dashboard...');
    const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      },
    });

    console.log('📋 [DIAG] Dashboard response:', {
      status: dashboardResponse.status,
      ok: dashboardResponse.ok,
      url: dashboardResponse.url,
      redirected: dashboardResponse.redirected
    });

    if (dashboardResponse.ok) {
      const html = await dashboardResponse.text();

      console.log('📄 [DIAG] Dashboard HTML length:', html.length);
      console.log('📄 [DIAG] Dashboard URL final:', dashboardResponse.url);

      // Análise mais detalhada
      const hasLogin = html.toLowerCase().includes('login');
      const hasLogout = html.toLowerCase().includes('logout') || html.toLowerCase().includes('sair');
      const hasDashboard = html.toLowerCase().includes('dashboard');
      const hasPasswordField = html.includes('type="password"') ||
        html.includes('name="password"') ||
        html.includes('id="password"');
      const hasEmailField = html.includes('type="email"') ||
        html.includes('name="email"') ||
        html.includes('id="email"');

      console.log('🔍 [DIAG] Análise do HTML:');
      console.log('  - Contém "login":', hasLogin);
      console.log('  - Contém "logout/sair":', hasLogout);
      console.log('  - Contém "dashboard":', hasDashboard);
      console.log('  - Tem campo senha:', hasPasswordField);
      console.log('  - Tem campo email:', hasEmailField);

      // Log de trechos específicos para debug
      const htmlLower = html.toLowerCase();
      if (htmlLower.includes('erro') || htmlLower.includes('error')) {
        console.log('⚠️ [DIAG] Possível mensagem de erro detectada');
        const errorMatch = html.match(/(erro|error)[^<]{0,100}/i);
        if (errorMatch) {
          console.log('⚠️ [DIAG] Erro encontrado:', errorMatch[0]);
        }
      }

      // Decisão final
      const isLoginPage = hasPasswordField && hasEmailField;
      const isDashboardPage = !isLoginPage && (hasLogout || hasDashboard);

      if (isDashboardPage) {
        console.log('✅ [DIAG] LOGIN SUCESSO - Dashboard detectado');
        return { success: true, redirect: '/dashboard' };
      } else {
        console.log('❌ [DIAG] LOGIN FALHOU - Ainda na página de login');

        // Salvar HTML para análise (primeiros 1000 chars)
        console.log('📝 [DIAG] HTML completo (amostra):', html.substring(0, 1000));

        return { success: false };
      }

    } else {
      console.log('❌ [DIAG] Dashboard inacessível, status:', dashboardResponse.status);
      return { success: false };
    }

  } catch (error) {
    console.error('💥 [DIAG] Erro crítico:', error);
    return { success: false };
  }
}

/**
 * Verificar autenticação
 */
export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const html = await response.text();
      const hasPasswordField = html.includes('type="password"');
      return !hasPasswordField; // Se não tem campo de senha, está logado
    }

    return false;
  } catch (error) {
    console.error('Erro no checkAuth:', error);
    return false;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<boolean> {
  try {
    await fetch('https://chatenergia.com.br/logout', {
      method: 'GET',
      credentials: 'include',
    });
    return true;
  } catch (error) {
    console.error('Erro no logout:', error);
    return false;
  }
}

/**
 * Obter dados do usuário
 */
export async function getUserData(): Promise<any> {
  console.log('👤 [USER] Obtendo dados do usuário...');

  try {
    const response = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const html = await response.text();
      console.log('📄 [USER] HTML obtido, tamanho:', html.length);

      // Extrair nome do usuário do HTML
      const userName = extractUserName(html);
      console.log('👤 [USER] Nome extraído:', userName);

      return {
        name: userName || 'Usuário EnergIA',
        email: '', // Email não está disponível no HTML da dashboard
      };
    }

    console.log('❌ [USER] Falha ao acessar dashboard:', response.status);
    return null;
  } catch (error) {
    console.error('💥 [USER] Erro ao obter dados:', error);
    return null;
  }
}

/**
 * Extrair nome do usuário do HTML da dashboard
 */
function extractUserName(html: string): string | null {
  console.log('🔍 [EXTRACT] Extraindo nome do usuário...');

  try {
    // Padrão 1: Procurar por "Olá, [Nome]!" no HTML
    const greetingPattern = /Olá,\s*<br><h3>\s*([^<]+)!/i;
    let match = html.match(greetingPattern);

    if (match && match[1]) {
      const name = match[1].trim();
      console.log('✅ [EXTRACT] Nome encontrado via padrão de saudação:', name);
      return name;
    }

    // Padrão 2: Procurar por estrutura HTML mais flexível
    const flexiblePattern = /Olá,.*?<h3[^>]*>\s*([^<]+)\s*<\/h3>/is;
    match = html.match(flexiblePattern);

    if (match && match[1]) {
      const name = match[1].trim().replace(/!$/, ''); // Remove exclamação se houver
      console.log('✅ [EXTRACT] Nome encontrado via padrão flexível:', name);
      return name;
    }

    // Padrão 3: Procurar por qualquer texto após "Olá"
    const simplePattern = /Olá,?\s*([^<\n!]+)/i;
    match = html.match(simplePattern);

    if (match && match[1]) {
      const name = match[1].trim();
      console.log('✅ [EXTRACT] Nome encontrado via padrão simples:', name);
      return name;
    }

    console.log('❌ [EXTRACT] Nome não encontrado em nenhum padrão');
    console.log('🔍 [EXTRACT] Amostra do HTML para debug:', html.substring(0, 1000));

    return null;
  } catch (error) {
    console.error('💥 [EXTRACT] Erro na extração:', error);
    return null;
  }
}

/**
 * Testar conectividade e estado da API
 */
export async function testApiConnection(): Promise<{ connected: boolean, message: string }> {
  console.log('🔗 [TEST] Iniciando teste de conectividade...');

  try {
    // 1. Teste básico de conectividade
    console.log('🌐 [TEST] Testando página inicial...');
    const homeResponse = await fetch('https://chatenergia.com.br/', {
      method: 'GET',
    });

    console.log('🌐 [TEST] Página inicial:', homeResponse.status, homeResponse.ok);

    // 2. Teste da página de login
    console.log('📄 [TEST] Testando página de login...');
    const loginResponse = await fetch('https://chatenergia.com.br/login', {
      method: 'GET',
    });

    console.log('📄 [TEST] Página login:', loginResponse.status, loginResponse.ok);

    // 3. Teste do dashboard (deve redirecionar para login se não autenticado)
    console.log('🔒 [TEST] Testando acesso ao dashboard...');
    const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
      method: 'GET',
    });

    console.log('🔒 [TEST] Dashboard:', dashboardResponse.status, dashboardResponse.ok);

    if (homeResponse.ok && loginResponse.ok) {
      const message = `✅ Servidor online
📄 Página inicial: ${homeResponse.status}
🔐 Página login: ${loginResponse.status}
🔒 Dashboard: ${dashboardResponse.status}

Servidor está funcionando normalmente.`;

      return {
        connected: true,
        message
      };
    } else {
      return {
        connected: false,
        message: `❌ Problemas no servidor:
Página inicial: ${homeResponse.status}
Página login: ${loginResponse.status}`
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('💥 [TEST] Erro na conectividade:', error);

    return {
      connected: false,
      message: `❌ Erro de conexão: ${errorMsg}

Verifique:
- Conexão com internet
- Servidor chatenergia.com.br
- Firewall/proxy`
    };
  }
}

/**
 * Verificar se credenciais são válidas via múltiplos testes
 */
export async function validateCredentials(credentials: LoginCredentials): Promise<{ valid: boolean, details: string }> {
  console.log('🔍 [VALID] Validando credenciais para:', credentials.email);

  if (!credentials.email || !credentials.password) {
    return {
      valid: false,
      details: 'Email ou senha vazios'
    };
  }

  if (!credentials.email.includes('@')) {
    return {
      valid: false,
      details: 'Email inválido (sem @)'
    };
  }

  if (credentials.password.length < 3) {
    return {
      valid: false,
      details: 'Senha muito curta'
    };
  }

  // Testar login real
  try {
    const result = await loginUserAlternative(credentials);

    return {
      valid: result.success,
      details: result.success
        ? '✅ Credenciais válidas!'
        : '❌ Credenciais inválidas ou erro no servidor'
    };

  } catch (error) {
    return {
      valid: false,
      details: `Erro no teste: ${error instanceof Error ? error.message : 'Desconhecido'}`
    };
  }
}

/**
 * Login alternativo com teste de diferentes métodos
 */
export async function loginUserAlternative(credentials: LoginCredentials): Promise<LoginResponse> {
  console.log('🧪 [ALT] Testando métodos alternativos para:', credentials.email);

  const methods = [
    {
      name: 'URLSearchParams',
      prepare: () => {
        const params = new URLSearchParams();
        params.append('email', credentials.email);
        params.append('password', credentials.password);
        return {
          body: params,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };
      }
    },
    {
      name: 'FormData',
      prepare: () => {
        const formData = new FormData();
        formData.append('email', credentials.email);
        formData.append('password', credentials.password);
        return { body: formData, headers: {} };
      }
    },
    {
      name: 'JSON',
      prepare: () => {
        return {
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          headers: { 'Content-Type': 'application/json' }
        };
      }
    }
  ];

  for (const method of methods) {
    console.log(`🧪 [ALT] Tentando método: ${method.name}`);

    try {
      const { body, headers } = method.prepare();

      const response = await fetch('https://chatenergia.com.br/login', {
        method: 'POST',
        body,
        credentials: 'include',
        headers: {
          ...headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (compatible; EnergIA-App/1.0)'
        },
      });

      console.log(`📥 [ALT] ${method.name} response:`, response.status, response.statusText);

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Testar dashboard
      const dashboardResponse = await fetch('https://chatenergia.com.br/dashboard', {
        method: 'GET',
        credentials: 'include',
      });

      console.log(`📋 [ALT] ${method.name} dashboard:`, dashboardResponse.status, dashboardResponse.ok);

      if (dashboardResponse.ok) {
        const html = await dashboardResponse.text();
        const hasPasswordField = html.includes('type="password"');

        console.log(`🔍 [ALT] ${method.name} - Tem campo senha:`, hasPasswordField);

        if (!hasPasswordField) {
          console.log(`✅ [ALT] SUCESSO com método: ${method.name}`);
          return { success: true, redirect: '/dashboard' };
        }
      }

    } catch (error) {
      console.error(`💥 [ALT] Erro no método ${method.name}:`, error);
    }
  }

  console.log('❌ [ALT] Todos os métodos falharam');
  return { success: false };
}