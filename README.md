# EnergIA App React Native

App móvel (React Native + Expo, TypeScript) para login, chat com API (chatbot), notificações locais em horários aleatórios para estimular conversas e telemetria diária de engajamento enviada ao backend (Node) que persiste em MongoDB. **Build 100% local** via `expo prebuild` + Gradle/Xcode. Sem serviços de build.

## Tecnologias

- **React Native** com **Expo SDK 54**
- **TypeScript** com strict mode
- **Expo Router** para navegação baseada em arquivos
- **ESLint** + **Prettier** para qualidade de código
- **Jest** para testes unitários
- Build local com `expo prebuild`

## Estrutura do Projeto

```
app/
  (auth)/login.tsx      # Tela de login
  (tabs)/index.tsx      # Tela principal (home)
  chat/index.tsx        # Tela de chat
  settings/index.tsx    # Configurações
  _layout.tsx           # Layout raiz
components/
  ui/                   # Componentes de UI reutilizáveis
  __tests__/           # Testes de componentes
lib/
  api/                 # Configuração do Axios
  auth/                # Gerenciamento de sessão
  chat/                # Hooks do chat
  metrics/             # Telemetria e métricas
  notifications/       # Notificações locais
  types/               # Tipos TypeScript
  data/                # Mocks e dados
tests/                 # Utilitários de teste
```

## Comandos de Desenvolvimento

### Instalação
```bash
npm install
```

### Desenvolvimento
```bash
npm run start          # Iniciar servidor Expo
npm run android        # Abrir no Android
npm run ios            # Abrir no iOS
npm run web            # Abrir no navegador web
```

### Qualidade de Código
```bash
npm run lint           # Executar ESLint
npm run lint:fix       # Corrigir problemas do ESLint
npm run format         # Formatar código com Prettier
npm run type-check     # Verificar tipos TypeScript
```

### Testes
```bash
npm run test           # Executar testes
npm run test:watch     # Executar testes em modo watch
npm run test:coverage  # Executar testes com cobertura
```

### Build Local
```bash
npx expo prebuild      # Gerar pastas android/ e ios/
cd android && ./gradlew assembleDebug    # Build Android debug
cd android && ./gradlew assembleRelease  # Build Android release
```

## Padrões de Desenvolvimento

### TypeScript
- Strict mode habilitado
- Tipagem completa para todas as props e modelos
- Interfaces/types em `lib/types/`

### React Patterns
- Componentes funcionais + Hooks
- Separação de responsabilidades (UI, hooks, serviços)
- Estado remoto com @tanstack/react-query (quando implementado)
- Tokens seguros com expo-secure-store (quando implementado)

### Qualidade
- ESLint + Prettier configurados
- Testes unitários com Jest
- Commitlint para mensagens padronizadas
- `npm run lint` e `npm run test` devem passar antes dos commits

## Status de Implementação

### ✅ Etapa 1 - Bootstrap & Qualidade (Concluída)
- [x] Projeto Expo TS com Router ativo
- [x] Scripts lint, test configurados
- [x] ESLint + Prettier configurados
- [x] Estrutura de pastas criada

### 🔄 Próximas Etapas
2. **HTTP e Sessão** - `axios` com interceptors e `SecureStore`
3. **Autenticação** - Tela de login e navegação protegida
4. **Chat** - Interface de chat com API
5. **Métricas** - Telemetria de engajamento
6. **Notificações** - Agenda pseudo-aleatória
7. **Background Tasks** - Renovação e sincronização
8. **Build Local** - APK/AAB assinados
9. **Segurança** - Proteção de dados sensíveis
10. **Documentação** - README e testes completos

## Compatibilidade

- **Android**: API 21+ (Android 5.0+)
- **iOS**: iOS 11.0+
- **Node.js**: 20.17.0+
- **TypeScript**: 5.9.2+

## Troubleshooting

### Problemas Comuns
1. **Build errors**: Execute `npx expo prebuild --clean`
2. **Metro cache**: Execute `npx expo start --clear`
3. **Type errors**: Execute `npm run type-check`
4. **Lint errors**: Execute `npm run lint:fix`

### Logs e Debug
- Use `console.log` moderadamente
- Para debug avançado, considere Flipper ou React Native Debugger
- Logs de produção serão integrados com Sentry (etapa 9)

## Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Execute `npm run lint` e `npm run test`
4. Commit suas alterações (`git commit -m 'Add some AmazingFeature'`)
5. Push para a branch (`git push origin feature/AmazingFeature`)
6. Abra um Pull Request

## Licença

Este projeto está sob licença proprietária. Veja o arquivo `LICENSE.md` para mais detalhes.
