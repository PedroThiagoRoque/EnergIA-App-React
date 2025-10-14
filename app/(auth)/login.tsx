import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useLoginValidation } from '../../lib/auth/useAuth';
import { router } from 'expo-router';
import { testApiConnection, loginUserAlternative, validateCredentials } from '../../lib/api/energia-simple';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { login, isLoading, error } = useAuth();
  const { errors, validateForm, clearErrors } = useLoginValidation();

  const handleLogin = async () => {
    console.log('🎯 LoginScreen: Botão de login pressionado');
    
    // Limpar erros anteriores
    clearErrors();

    // Validar formulário
    if (!validateForm(email, password)) {
      console.log('❌ LoginScreen: Validação do formulário falhou');
      return;
    }

    console.log('✅ LoginScreen: Formulário válido, iniciando login...');

    try {
      await login({ email: email.trim(), password });
      console.log('🎉 LoginScreen: Login bem-sucedido!');
      // Sucesso - o hook já faz o redirecionamento
    } catch (error) {
      // O erro já está sendo tratado pelo hook
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('💥 LoginScreen: Erro no login:', errorMessage);
      Alert.alert('Erro no Login', errorMessage);
    }
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    // Limpar erro de email quando o usuário começar a digitar
    if (errors.email) {
      clearErrors();
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    // Limpar erro de senha quando o usuário começar a digitar
    if (errors.password) {
      clearErrors();
    }
  };

  const handleTestConnection = async () => {
    console.log('🔧 LoginScreen: Testando conexão com API...');
    try {
      const result = await testApiConnection();
      Alert.alert(
        'Teste de Conectividade',
        result.message,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert(
        'Erro no Teste',
        'Não foi possível testar a conexão',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  };

  const handleDebugLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Digite email e senha para testar');
      return;
    }

    console.log('🧪 LoginScreen: Validando credenciais...');
    try {
      const result = await validateCredentials({ email: email.trim(), password });
      
      Alert.alert(
        'Validação de Credenciais', 
        result.details,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Erro no Teste',
        'Erro de conexão. Verifique sua internet.',
        [{ text: 'OK' }]
      );
    }
  };

  const fillTestCredentials = () => {
    Alert.alert(
      'Ajuda com Login',
      `Status atual:
${email ? '✅' : '❌'} Email preenchido
${password ? '✅' : '❌'} Senha preenchida

Para testar:
1. Preencha suas credenciais reais
2. Clique "Validar" para testar
3. Se validar OK, clique "Entrar"

Problemas comuns:
- Credenciais incorretas
- Servidor offline
- Conexão instável`,
      [
        { text: 'Fechar', style: 'cancel' },
        { 
          text: 'Simular Login',
          onPress: () => {
            Alert.alert(
              'Simular Login?',
              'Isso vai simular um login bem-sucedido para testar o app. Use apenas para desenvolvimento.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Simular',
                  onPress: () => {
                    console.log('🎭 Simulando login bem-sucedido...');
                    // Simular dados de usuário
                    router.replace('/(tabs)');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };



  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>EnergIA</Text>
              <Text style={styles.subtitle}>Faça login em sua conta</Text>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.email && styles.textInputError,
                ]}
                value={email}
                onChangeText={handleEmailChange}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
              {errors.email && (
                <Text style={styles.inputErrorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[
                    styles.textInput,
                    styles.passwordInput,
                    errors.password && styles.textInputError,
                  ]}
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.inputErrorText}>{errors.password}</Text>
              )}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                isLoading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.loginButtonText}>Entrando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Test Buttons */}
            <View style={styles.testButtonsContainer}>
              <TouchableOpacity
                style={[styles.testButton, { flex: 1, marginRight: 4 }]}
                onPress={handleTestConnection}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText}>Servidor</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, { flex: 1, marginHorizontal: 4 }]}
                onPress={handleDebugLogin}
                disabled={isLoading || !email || !password}
              >
                <Text style={styles.testButtonText}>Validar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.testButton, { flex: 1, marginLeft: 4 }]}
                onPress={fillTestCredentials}
                disabled={isLoading}
              >
                <Text style={styles.testButtonText}>Ajuda</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Problemas para entrar?{' '}
                <Text style={styles.footerLink}>Verifique sua conexão</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  formContainer: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  textInputError: {
    borderColor: '#DC2626',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 60,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 12,
    bottom: 12,
    justifyContent: 'center',
  },
  passwordToggleText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  inputErrorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testButtonsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  footerLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
});