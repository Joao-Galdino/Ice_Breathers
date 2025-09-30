import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const SessionCompleteScreen = ({ route, navigation }) => {
  const { rounds, holdTimes, sessionId } = route.params;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTotalHoldTime = () => {
    return holdTimes.reduce((total, round) => total + round.hold, 0);
  };

  const getAverageHoldTime = () => {
    if (holdTimes.length === 0) return 0;
    return Math.round(getTotalHoldTime() / holdTimes.length);
  };

  const getTotalBreaths = () => {
    return rounds * 30; // 30 respirações por round
  };

  const goHome = () => {
    navigation.navigate('Home');
  };

  const startNewSession = () => {
    navigation.navigate('Home');
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header de conclusão */}
          <View style={styles.headerContainer}>
            <Text style={styles.congratsEmoji}>🎉</Text>
            <Text style={styles.title}>Sessão Concluída!</Text>
            <Text style={styles.subtitle}>
              Parabéns! Você completou sua sessão de respiração.
            </Text>
          </View>

          {/* Estatísticas básicas */}
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rounds:</Text>
              <Text style={styles.statValue}>{rounds}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total de respirações:</Text>
              <Text style={styles.statValue}>{getTotalBreaths()}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tempo total de retenção:</Text>
              <Text style={styles.statValue}>{formatTime(getTotalHoldTime())}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tempo médio por round:</Text>
              <Text style={styles.statValue}>{formatTime(getAverageHoldTime())}</Text>
            </View>
          </View>

          {/* Tempos de retenção detalhados */}
          {holdTimes.length > 0 && (
            <View style={styles.holdTimesContainer}>
              <Text style={styles.holdTimesTitle}>Tempos de Retenção:</Text>
              {holdTimes.map((roundTime, index) => (
                <View key={index} style={styles.holdTimeRow}>
                  <Text style={styles.roundLabel}>Round {roundTime.round}:</Text>
                  <Text style={styles.holdTimeValue}>
                    {formatTime(roundTime.hold)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Progresso e motivação */}
          <View style={styles.motivationContainer}>
            <Text style={styles.motivationTitle}>Excelente trabalho!</Text>
            <Text style={styles.motivationText}>
              Cada sessão de respiração contribui para o seu bem-estar físico e mental.
              Continue praticando regularmente para obter os melhores resultados.
            </Text>
          </View>

          {/* Dicas para próxima sessão */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Dicas para próxima vez:</Text>
            <Text style={styles.tipText}>
              • Tente aumentar gradualmente o tempo de retenção
            </Text>
            <Text style={styles.tipText}>
              • Mantenha-se relaxado durante a retenção
            </Text>
            <Text style={styles.tipText}>
              • Pratique em um ambiente calmo e confortável
            </Text>
            <Text style={styles.tipText}>
              • Seja consistente com a prática diária
            </Text>
          </View>

          {/* Botões de ação */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={startNewSession}
            >
              <Text style={styles.buttonText}>Nova Sessão</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={goHome}
            >
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Voltar ao Início
              </Text>
            </TouchableOpacity>
          </View>

          {/* Informação da sessão */}
          {sessionId && (
            <View style={styles.sessionInfoContainer}>
              <Text style={styles.sessionInfoText}>
                Sessão #{sessionId} salva com sucesso
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  congratsEmoji: {
    fontSize: 60,
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  holdTimesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  holdTimesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 15,
  },
  holdTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  roundLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  holdTimeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3498db',
  },
  motivationContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  motivationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonsContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#ff6b6b',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  secondaryButtonText: {
    color: 'rgba(255,255,255,0.9)',
  },
  sessionInfoContainer: {
    alignItems: 'center',
  },
  sessionInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
  },
});

export default SessionCompleteScreen;
