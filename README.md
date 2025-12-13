# EnergIA App React Native

App mobile (React Native + Expo, TypeScript) para login, chat com API (chatbot), notificações locais e telemetria. Este projeto conecta-se a um backend legado utilizando adaptações para autenticação via cookies e streaming de resposta SSE.

## 📱 Preview

<p align="center">
  <img src="assets/appreact1.png" alt="App Screen 1" width="45%">
  <img src="assets/appreact2.png" alt="App Screen 2" width="45%">
</p>

## 🚀 Como Rodar o Projeto

Para desenvolver localmente no Linux/Android, utilize o seguinte comando:

```bash
npx expo start --go
```

Este comando inicia o servidor de desenvolvimento do Expo e permite rodar o app no Expo Go ou em um emulador Android/iOS conectado.

Outros comandos:
```bash
npm run start          # Iniciar servidor Expo padrão
npm run android        # Abrir no Android
npm run ios            # Abrir no iOS (macOS apenas)
npm run web            # Abrir no navegador web
npm run test           # Rodar testes unitários
```

## 📱 Funcionalidades

### Autenticação
- **Login Seguro**: Integração com API legada usando `multipart/form-data`.
- **Gestão de Sessão**: Armazenamento seguro de cookies de autenticação (`connect.sid`) usando `expo-secure-store`.
- **Persistência**: Mantém o usuário logado entre sessões.

### Dashboard Moderno
- **Foco no Chat**: Design minimalista focado na interação principal.
- **Header Limpo**: Saudação personalizada baseada no horário.
- **Status de Conexão**: Indicador visual de conectividade.

### Chat Inteligente (EnergIA)
- **Mensagens em Tempo Real**: Suporte a respostas via Server-Sent Events (SSE).
- **Icebreakers Dinâmicos**: Sugestões de conversa que se renovam a cada resposta da IA.
- **Fallback Offline**: Sugestões locais caso a API falhe.
- **Interface Responsiva**: Input que se adapta ao teclado e safe areas.

## 🛠️ Principais Bibliotecas

As principais dependências do projeto são:

- **Core**:
  - `react-native`: Framework UI.
  - `expo`: Plataforma de desenvolvimento.
  - `typescript`: Tipagem estática.

- **Navegação & UI**:
  - `expo-router`: Roteamento baseado em arquivos (semelhante ao Next.js).
  - `react-native-safe-area-context`: Gestão de áreas seguras (notches, home bars).
  - `expo-linear-gradient`: Gradientes visuais.
  - `expo-status-bar`: Controle da barra de status.

- **Dados & Conexão**:
  - `axios`: Cliente HTTP com interceptors para cookies.
  - `expo-secure-store`: Armazenamento criptografado de tokens.
  - `@react-native-async-storage/async-storage`: Armazenamento local simples.

- **Qualidade**:
  - `eslint` + `prettier`: Padronização de código.
  - `jest`: Testes unitários.

## 📂 Estrutura do Projeto

```
app/
  (auth)/login.tsx      # Tela de login
  (tabs)/index.tsx      # Dashboard (Home)
  chat/index.tsx        # Tela de Chat principal
  _layout.tsx           # Configuração de rotas
components/             # Componentes reutilizáveis (Icebreakers, etc)
lib/
  api/                  # Serviços de API e setup do Axios
  auth/                 # Contexto e hooks de autenticação
  hooks/                # Hooks customizados (useChat, useIcebreakers)
  types/                # Definições de tipos TypeScript
```

## Troubleshooting

### Problemas de Build
Caso encontre erros de types ou cache:
```bash
npx expo start --clear
```

### Autenticação Falhando
Verifique se o backend legado está acessível e se os cookies estão sendo setados corretamente no `expo-secure-store`.

