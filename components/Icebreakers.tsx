import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export interface IcebreakersProps {
  icebreakers: string[];
  dicaDoDia?: string;
  onIcebreakerPress: (text: string) => void;
  onRefresh?: () => void;
  shuffleTrigger?: number;
}

export function Icebreakers({
  icebreakers,
  dicaDoDia,
  isLoading,
  onIcebreakerPress,
  onRefresh,
  shuffleTrigger = 0,
}: IcebreakersProps) {
  // Selecionar 3 sugestões aleatórias
  const suggestions = React.useMemo(() => {
    const getRandomSuggestions = (items: string[], count: number = 3) => {
      if (items.length <= count) return items;
      const shuffled = [...items].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
    return getRandomSuggestions(icebreakers, 3);
  }, [icebreakers, shuffleTrigger]);

  // Debug
  console.log('🎲 Icebreakers component - icebreakers:', icebreakers.length, 'suggestions:', suggestions.length);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>Carregando sugestões...</Text>
        </View>
      </View>
    );
  }

  // Se não há sugestões disponíveis, não mostrar nada
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Dica do dia, se disponível */}
      {dicaDoDia && (
        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>{dicaDoDia}</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>💡 Começar por:</Text>
        {error && (
          <Text style={styles.warningText}>
            (sugestões locais)
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`suggestion-${index}`}
            style={styles.suggestionButton}
            onPress={() => onIcebreakerPress(suggestion)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Sugestão: ${suggestion}`}
            accessibilityHint="Toque para enviar esta mensagem"
          >
            <Text style={styles.suggestionText} numberOfLines={2}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  tipContainer: {
    backgroundColor: '#e8f5e8',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 4,
  },
  tipText: {
    fontSize: 13,
    color: '#2e7d32',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  warningText: {
    fontSize: 12,
    color: '#f57c00',
    marginLeft: 4,
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  suggestionButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 1,
    minWidth: 100,
  },
  suggestionText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 16,
  },
  icebreakerButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    minWidth: 120,
    maxWidth: 180,
  },
  icebreakerText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});