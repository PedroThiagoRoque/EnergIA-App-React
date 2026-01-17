import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import { useAuth } from '../../lib/auth/useAuth';
import { userService } from '../../lib/api/services/user';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [greeting, setGreeting] = useState('');
  const [notification, setNotification] = useState('');

  const isVolts = user?.group === 'Volts';

  // Theme Colors
  const theme = {
    primary: isVolts ? '#64748B' : '#4CAF50',
    primaryDark: isVolts ? '#475569' : '#2E7D32',
    background: isVolts ? '#F8FAFC' : '#F7F9FC',
    accent: isVolts ? '#94A3B8' : '#4CAF50',
    statusBg: isVolts ? '#F1F5F9' : '#E8F5E9',
    statusText: isVolts ? '#475569' : '#2E7D32'
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    // Fetch notification
    if (user?.id) {
      userService.getNotification(user.id).then(setNotification);

      // Schedule dynamic daily toasts (Treatment vs Control)
      if (!isVolts) {
        userService.getDailyToasts().then(toasts => {
          if (toasts && toasts.length > 0) {
            import('../../lib/notifications').then(({ scheduleToastNotifications }) => {
              scheduleToastNotifications(toasts);
            });
          }
        });
      } else {
        // Schedule fixed Volts messages
        import('../../lib/notifications').then(({ scheduleVoltsDailyNotifications }) => {
          scheduleVoltsDailyNotifications();
        });
      }
    }
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };

  const navigateToChat = () => {
    router.push('/chat');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Background decoration */}
      <View style={styles.bgDecorationCircle} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={styles.greetingSub}>{greeting},</Text>
          <Text style={styles.greetingName}>{user?.name?.split(' ')[0] || 'Usuário'}!</Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}
          disabled={authLoading}
        >
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={[styles.statusContainer, { backgroundColor: theme.statusBg }]}>
          <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
          <Text style={[styles.statusText, { color: theme.statusText }]}>
            {isVolts ? 'Assistente Online' : 'EnergIA Online'}
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          {isVolts
            ? 'Como posso ajudar você hoje?'
            : 'Como posso ajudar a economizar energia hoje?'}
        </Text>

        <TouchableOpacity
          style={styles.chatButtonContainer}
          onPress={navigateToChat}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.chatButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chatIconBubble}>
              <Ionicons name="chatbubbles" size={32} color={theme.primary} />
            </View>
            <View style={styles.chatBtnTextContainer}>
              <Text style={styles.chatBtnTitle}>{isVolts ? 'Conversar' : 'Iniciar Conversa'}</Text>
              <Text style={styles.chatBtnSubtitle}>
                {isVolts ? 'Tire dúvidas e converse' : 'Tire dúvidas e receba dicas'}
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={40} color="rgba(255,255,255,0.9)" />
          </LinearGradient>
        </TouchableOpacity>


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  bgDecorationCircle: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  greetingSub: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  greetingName: {
    fontSize: 28,
    color: '#1E293B',
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoutBtn: {
    padding: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  statusText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 40,
    marginBottom: 40,
    maxWidth: '80%',
  },
  chatButtonContainer: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 48,
  },
  chatButton: {
    borderRadius: 24,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    height: 120,
  },
  chatIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  chatBtnTextContainer: {
    flex: 1,
  },
  chatBtnTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  chatBtnSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  tipsSection: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 16,
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
  },
  tipText: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 22,
  },
});