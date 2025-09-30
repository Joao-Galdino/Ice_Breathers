import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import ApiService from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [selectedRounds, setSelectedRounds] = useState(0);
  const [stats, setStats] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await ApiService.getSessionStats();
      setStats(statsData);
    } catch (error) {
      console.log('Erro ao carregar estatísticas:', error);
    }
  };

  const handleStartSession = () => {
    if (selectedRounds === 0) {
      Alert.alert('Erro', 'Selecione o número de rounds');
      return;
    }

    navigation.navigate('BreathingSession', {
      rounds: selectedRounds,
      breathsPerRound: 30,
      breathDuration: 3.55,
    });
  };

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

  const RoundButton = ({ rounds }) => (
    <TouchableOpacity
      style={[
        styles.roundButton,
        selectedRounds === rounds && styles.selectedRoundButton,
      ]}
      onPress={() => setSelectedRounds(rounds)}
    >
      <Text
        style={[
          styles.roundButtonText,
          selectedRounds === rounds && styles.selectedRoundButtonText,
        ]}
      >
        {rounds} Round{rounds > 1 ? 's' : ''}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, subtitle }) => (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Olá, {user?.username}! 👋</Text>
              <Text style={styles.subtitle}>Pronto para respirar?</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={handleLogout}>
              <Text style={styles.profileButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* Estatísticas */}
          {stats && (
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Suas Estatísticas</Text>
              <View style={styles.statsGrid}>
                <StatCard
                  title="Sessões Totais"
                  value={stats.total_sessions}
                />
                <StatCard
                  title="Tempo Total"
                  value={stats.total_time}
                />
                <StatCard
                  title="Esta Semana"
                  value={stats.sessions_this_week}
                />
                <StatCard
                  title="Este Mês"
                  value={stats.sessions_this_month}
                />
              </View>
            </View>
          )}

          {/* Seleção de Rounds */}
          <View style={styles.roundsContainer}>
            <Text style={styles.sectionTitle}>Selecione o número de rounds:</Text>
            <View style={styles.roundsGrid}>
              <RoundButton rounds={2} />
              <RoundButton rounds={3} />
              <RoundButton rounds={4} />
              <RoundButton rounds={5} />
            </View>
          </View>

          {/* Botão Iniciar */}
          <TouchableOpacity
            style={[
              styles.startButton,
              selectedRounds === 0 && styles.disabledStartButton,
            ]}
            onPress={handleStartSession}
            disabled={selectedRounds === 0}
          >
            <Text style={styles.startButtonText}>Iniciar Sessão</Text>
          </TouchableOpacity>

          {/* Informações da Técnica */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Técnica Wim Hof</Text>
            <Text style={styles.infoText}>
              • 30 respirações profundas por round{'\n'}
              • Retenção da respiração{'\n'}
              • Recuperação com respiração profunda{'\n'}
              • Benefícios: redução do stress, mais energia
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '600',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 2,
  },
  roundsContainer: {
    marginBottom: 30,
  },
  roundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roundButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedRoundButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'white',
  },
  roundButtonText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedRoundButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  startButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 30,
  },
  disabledStartButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 0.6,
  },
  startButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  infoContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
});

export default HomeScreen;
