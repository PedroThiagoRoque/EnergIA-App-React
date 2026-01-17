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
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth/useAuth';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const VINCULO_OPTIONS = ['Estudante', 'Técnico Administrativo', 'Docente', 'Tercerizado', 'Outro'];
const GENDER_OPTIONS = ['Masculino', 'Feminino', 'Não binário', 'Prefiro não dizer'];
const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [ageRange, setAgeRange] = useState('');
    const [gender, setGender] = useState('');
    const [vinculo, setVinculo] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Modal states
    const [modalType, setModalType] = useState<'vinculo' | 'gender' | 'age' | null>(null);

    const { register, isLoading, error } = useAuth();
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!name.trim()) errors.name = 'Nome é obrigatório';

        // Email basic validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) errors.email = 'Email é obrigatório';
        else if (!emailRegex.test(email)) errors.email = 'Email inválido';

        if (!password) errors.password = 'Senha é obrigatória';
        else if (password.length < 6) errors.password = 'A senha deve ter pelo menos 6 caracteres';

        if (password !== confirmPassword) errors.confirmPassword = 'As senhas não coincidem';

        if (!ageRange) errors.ageRange = 'Selecione uma faixa etária';
        if (!gender) errors.gender = 'Selecione um gênero';
        if (!vinculo) errors.vinculo = 'Selecione um vínculo';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        try {
            await register({
                name,
                email,
                password,
                confirmPassword,
                ageRange,
                gender,
                vinculo,
            });
            // Success is handled by useAuth (redirects)
        } catch (err: any) {
            console.error('Registration error:', err);
            Alert.alert('Erro no registro', err.message || 'Ocorreu um erro ao criar a conta.');
        }
    };

    const renderOptionModal = () => {
        if (!modalType) return null;

        let options: string[] = [];
        let setOption: (val: string) => void = () => { };
        let title = '';

        switch (modalType) {
            case 'vinculo':
                options = VINCULO_OPTIONS;
                setOption = setVinculo;
                title = 'Selecione seu Vínculo';
                break;
            case 'gender':
                options = GENDER_OPTIONS;
                setOption = setGender;
                title = 'Selecione seu Gênero';
                break;
            case 'age':
                options = AGE_RANGES;
                setOption = setAgeRange;
                title = 'Selecione sua Faixa Etária';
                break;
        }

        return (
            <Modal
                visible={!!modalType}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalType(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{title}</Text>
                            <TouchableOpacity onPress={() => setModalType(null)}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        setOption(item);
                                        setFormErrors({ ...formErrors, [modalType]: '' });
                                        setModalType(null);
                                    }}
                                >
                                    <Text style={styles.optionText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
                            <Text style={styles.title}>Crie sua conta</Text>
                            <Text style={styles.subtitle}>Junte-se ao EnergIA</Text>
                        </View>

                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome Completo</Text>
                            <TextInput
                                style={[styles.textInput, formErrors.name && styles.textInputError]}
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                                }}
                                placeholder="Seu nome completo"
                                placeholderTextColor="#9CA3AF"
                            />
                            {formErrors.name && <Text style={styles.inputErrorText}>{formErrors.name}</Text>}
                        </View>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={[styles.textInput, formErrors.email && styles.textInputError]}
                                value={email}
                                onChangeText={(text) => {
                                    setEmail(text);
                                    if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                                }}
                                placeholder="seu.email@exemplo.com"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {formErrors.email && <Text style={styles.inputErrorText}>{formErrors.email}</Text>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Senha</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.textInput, styles.passwordInput, formErrors.password && styles.textInputError]}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                                    }}
                                    placeholder="Sua senha"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    style={styles.passwordToggle}
                                    onPress={() => setShowPassword(!showPassword)}
                                >
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            {formErrors.password && <Text style={styles.inputErrorText}>{formErrors.password}</Text>}
                        </View>

                        {/* Confirm Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirmar Senha</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={[styles.textInput, styles.passwordInput, formErrors.confirmPassword && styles.textInputError]}
                                    value={confirmPassword}
                                    onChangeText={(text) => {
                                        setConfirmPassword(text);
                                        if (formErrors.confirmPassword) setFormErrors({ ...formErrors, confirmPassword: '' });
                                    }}
                                    placeholder="Confirme sua senha"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    style={styles.passwordToggle}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            {formErrors.confirmPassword && <Text style={styles.inputErrorText}>{formErrors.confirmPassword}</Text>}
                        </View>

                        {/* Selects: Age, Gender, Vinculo */}
                        <TouchableOpacity onPress={() => setModalType('age')} style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Faixa Etária</Text>
                            <View style={[styles.textInput, styles.selectInput, formErrors.ageRange && styles.textInputError]}>
                                <Text style={!ageRange ? styles.placeholderText : styles.valueText}>
                                    {ageRange || "Selecione..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </View>
                            {formErrors.ageRange && <Text style={styles.inputErrorText}>{formErrors.ageRange}</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalType('gender')} style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Gênero</Text>
                            <View style={[styles.textInput, styles.selectInput, formErrors.gender && styles.textInputError]}>
                                <Text style={!gender ? styles.placeholderText : styles.valueText}>
                                    {gender || "Selecione..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </View>
                            {formErrors.gender && <Text style={styles.inputErrorText}>{formErrors.gender}</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setModalType('vinculo')} style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Vínculo com a Instituição</Text>
                            <View style={[styles.textInput, styles.selectInput, formErrors.vinculo && styles.textInputError]}>
                                <Text style={!vinculo ? styles.placeholderText : styles.valueText}>
                                    {vinculo || "Selecione..."}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </View>
                            {formErrors.vinculo && <Text style={styles.inputErrorText}>{formErrors.vinculo}</Text>}
                        </TouchableOpacity>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                    <Text style={styles.registerButtonText}>Criando conta...</Text>
                                </View>
                            ) : (
                                <Text style={styles.registerButtonText}>Cadastrar</Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                Já tem uma conta?{' '}
                                <Text style={styles.footerLink} onPress={() => router.push('/(auth)/login')}>
                                    Faça login
                                </Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {renderOptionModal()}
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
        padding: 24,
        paddingBottom: 40,
    },
    formContainer: {
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
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
        marginBottom: 16,
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
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    valueText: {
        color: '#1F2937',
    },
    textInputError: {
        borderColor: '#DC2626',
    },
    inputErrorText: {
        color: '#DC2626',
        fontSize: 12,
        marginTop: 4,
    },
    passwordContainer: {
        position: 'relative',
    },
    passwordInput: {
        paddingRight: 50,
    },
    passwordToggle: {
        position: 'absolute',
        right: 16,
        top: 12,
        bottom: 12,
        justifyContent: 'center',
    },
    registerButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    registerButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    registerButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        maxHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    optionItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
    },
});
