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


export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error } = useAuth();
  const { errors, validateForm, clearErrors } = useLoginValidation();

  const handleLogin = async () => {
    console.log('🎯 LoginScreen: Botão ENTRAR pressionado - executando login unificado');

    // Limpar erros anteriores
    clearErrors();

    // Validação básica do formulário (UI)
    if (!validateForm(email, password)) {
      console.log('❌ LoginScreen: Validação básica do formulário falhou');
      return;
    }

    console.log('✅ LoginScreen: Validação básica OK, executando login completo...');

    try {
      // O hook login agora faz TUDO: validação + autenticação + redirecionamento
      await login({ email: email.trim(), password });
      console.log('🎉 LoginScreen: Login unificado bem-sucedido!');
      // Sucesso - o hook já faz o redirecionamento
    } catch (error) {
      // O erro já está sendo tratado pelo hook
      const errorMessage = error instanceof Error ? error.message : 'Erro no login';
      console.error('💥 LoginScreen: Erro no login unificado:', errorMessage);

      // Mostrar erro mais amigável
      Alert.alert(
        'Login não realizado',
        `${errorMessage}\n\nPor favor, verifique suas credenciais e tente novamente.`,
        [
          { text: 'OK' }
        ]
      );
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
                  <Text style={styles.loginButtonText}>Conectando...</Text>
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>



            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Problemas para entrar?{' '}
                <Text style={styles.footerLink}>Verifique sua conexão</Text>
              </Text>
              <Text style={[styles.footerText, { marginTop: 12 }]}>
                Não tem uma conta?{' '}
                <Text
                  style={styles.footerLink}
                  onPress={() => router.push('/(auth)/register')}
                >
                  Cadastre-se
                </Text>
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