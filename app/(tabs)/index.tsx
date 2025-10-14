import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../lib/auth/useAuth';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { user, logout, isLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const navigateToChat = () => {
    router.push('/chat');
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EnergIA Dashboard</Text>
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userText}>Olá, {user.name}!</Text>
            {user.email && <Text style={styles.emailText}>{user.email}</Text>}
          </View>
        )}
      </View>

      <View style={styles.content}>
        {/* Cards de funcionalidades */}
        <View style={styles.cardGrid}>
          <TouchableOpacity style={styles.card} onPress={navigateToChat}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💬</Text>
            </View>
            <Text style={styles.cardTitle}>Chat IA</Text>
            <Text style={styles.cardSubtitle}>
              Converse com nosso assistente de eficiência energética
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={navigateToSettings}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>⚙️</Text>
            </View>
            <Text style={styles.cardTitle}>Configurações</Text>
            <Text style={styles.cardSubtitle}>
              Gerencie suas preferências e conta
            </Text>
          </TouchableOpacity>

          <View style={[styles.card, styles.cardDisabled]}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>📊</Text>
            </View>
            <Text style={styles.cardTitle}>Relatórios</Text>
            <Text style={styles.cardSubtitle}>
              Analise seu consumo energético
            </Text>
            <Text style={styles.comingSoon}>Em breve</Text>
          </View>

          <View style={[styles.card, styles.cardDisabled]}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>💡</Text>
            </View>
            <Text style={styles.cardTitle}>Dicas</Text>
            <Text style={styles.cardSubtitle}>
              Receba sugestões personalizadas
            </Text>
            <Text style={styles.comingSoon}>Em breve</Text>
          </View>
        </View>

        {/* Estatísticas rápidas */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Status da Conexão</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>✅</Text>
              <Text style={styles.statLabel}>Conectado à EnergIA</Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutButton, isLoading && styles.logoutButtonDisabled]}
        onPress={handleLogout}
        disabled={isLoading}
      >
        <Text style={styles.logoutButtonText}>
          {isLoading ? 'Saindo...' : 'Logout'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  userInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  userText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    width: '47%',
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  cardIcon: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconText: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  comingSoon: {
    fontSize: 10,
    color: '#F59E0B',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    margin: 24,
  },
  logoutButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});