import React, { useState, useRef, useEffect } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGuard } from '../../lib/auth/AuthGuard';
import { useAuth } from '../../lib/auth/useAuth';
import { useChat } from '../../lib/hooks/useChat';
import { useIcebreakers } from '../../lib/hooks/useIcebreakers';
import { Icebreakers } from '../../components/Icebreakers';
import type { ChatMessage } from '../../lib/types';

function ChatScreenContent() {
  const { user } = useAuth();
  const { messages, isLoading, error, sendMessage, addWelcomeMessage } = useChat();
  const {
    icebreakers,
    dicaDoDia,
    isLoading: icebreakersLoading,
    error: icebreakersError,
    refreshIcebreakers
  } = useIcebreakers();
  const [inputText, setInputText] = useState('');
  const [shuffleTrigger, setShuffleTrigger] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isVolts = user?.group === 'Volts';
  const theme = {
    header: isVolts ? '#64748B' : '#4CAF50',
    userBubble: isVolts ? '#64748B' : '#4CAF50',
    assistantType: isVolts ? '#64748B' : '#4CAF50'
  };

  // Mensagem de boas-vindas ao carregar
  useEffect(() => {
    addWelcomeMessage(user?.name, user?.group);
  }, [user?.name, user?.group, addWelcomeMessage]);

  // Shuffle icebreakers when AI responds
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Check if the last message is from the assistant (or EnergIA type)
      if (lastMessage.role !== 'user') {
        setShuffleTrigger(prev => prev + 1);
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      await sendMessage(messageText);
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof Error ? err.message : 'Erro de conexão'
      );
    }
  };

  const handleIcebreakerPress = async (text: string) => {
    // Enviar mensagem diretamente sem preencher input
    try {
      await sendMessage(text);
    } catch (err) {
      Alert.alert(
        'Erro',
        err instanceof Error ? err.message : 'Erro de conexão'
      );
    }
  };

  const formatMessage = (text: string | undefined | null) => {
    // Verificação de segurança
    if (!text || typeof text !== 'string') {
      return 'Mensagem não disponível';
    }
    // Formatar markdown básico (negrito)
    return text.replace(/\*\*(.*?)\*\*/g, '$1');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.aiMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.role === 'user' ? { backgroundColor: theme.userBubble } : styles.aiBubble
      ]}>
        {item.role !== 'user' && (
          <Text style={[styles.assistantType, { color: theme.assistantType }]}>EnergIA</Text>
        )}
        <Text style={[
          styles.messageText,
          item.role === 'user' ? styles.userText : styles.aiText
        ]}>
          {formatMessage(item.content)}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: theme.header },
          headerTintColor: 'white',
          headerTitleAlign: 'center',
          headerTitle: () => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                {isVolts ? 'Chat' : 'EnergIA Chat'}
              </Text>
              <Text style={{ fontSize: 12, color: 'white', opacity: 0.9 }}>
                {isVolts ? 'Assistente Pessoal' : 'Assistente de Eficiência Energética'}
              </Text>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.header} />
            <Text style={styles.loadingText}>EnergIA está pensando...</Text>
          </View>
        )}

        {/* Icebreakers - Only for Watts */}
        {!isVolts && (
          <Icebreakers
            icebreakers={icebreakers}
            dicaDoDia={dicaDoDia}
            isLoading={icebreakersLoading}
            onIcebreakerPress={handleIcebreakerPress}
            onRefresh={refreshIcebreakers}
            shuffleTrigger={shuffleTrigger}
          />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite sua pergunta..."
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: (!inputText.trim() || isLoading) ? '#ccc' : theme.header },
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function ChatScreen() {
  return (
    <AuthGuard requireAuth={true}>
      <ChatScreenContent />
    </AuthGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    // backgroundColor handled by style prop
    borderRadius: 16,
    padding: 12,
    maxWidth: '80%',
  },
  aiBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  assistantType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    // backgroundColor handled by inline style or if we want to change it here we can but it's hardcoded below.
    // Let's use the theme in the render
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});