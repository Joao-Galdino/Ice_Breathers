import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import OrganicCircle from '../components/OrganicCircle';
import ApiService from '../services/api';

const BreathingSessionScreen = ({ route, navigation }) => {
  const { rounds, breathsPerRound, breathDuration } = route.params;
  
  // Estados principais
  const [currentRound, setCurrentRound] = useState(1);
  const [currentBreath, setCurrentBreath] = useState(1);
  const [sessionPhase, setSessionPhase] = useState('breathing'); // breathing, holding, recovery
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Estados de tempo
  const [holdTime, setHoldTime] = useState(0);
  const [recoveryTime, setRecoveryTime] = useState(0);
  const [roundHoldTimes, setRoundHoldTimes] = useState([]);
  
  // Estados do backend
  const [sessionId, setSessionId] = useState(null);
  
  // Refs para timers
  const breathingTimer = useRef(null);
  const holdTimer = useRef(null);
  const recoveryTimer = useRef(null);
  const holdStartTime = useRef(null);
  const recoveryStartTime = useRef(null);

  useEffect(() => {
    initializeSession();
    
    // Handler para botão voltar do Android
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      clearAllTimers();
      backHandler.remove();
    };
  }, []);

  const handleBackPress = () => {
    if (isRunning) {
      Alert.alert(
        'Sessão em Progresso',
        'Deseja realmente parar a sessão?',
        [
          { text: 'Continuar', style: 'cancel' },
          { text: 'Parar', style: 'destructive', onPress: stopSession },
        ]
      );
      return true;
    }
    return false;
  };

  const initializeSession = async () => {
    try {
      const sessionData = await ApiService.createSession({
        rounds,
        breaths_per_round: breathsPerRound,
        breath_duration: breathDuration,
      });
      
      setSessionId(sessionData.id);
      console.log('Sessão criada:', sessionData.id);
      
      // Iniciar sessão
      startSession();
    } catch (error) {
      console.log('Erro ao criar sessão, modo offline:', error);
      startSession();
    }
  };

  const startSession = () => {
    setIsRunning(true);
    setSessionPhase('breathing');
    startBreathingCycle();
  };

  const startBreathingCycle = () => {
    if (!isRunning || isPaused) return;

    console.log(`Respiração ${currentBreath}/${breathsPerRound} - Round ${currentRound}`);
    
    // Fase de inspiração
    setTimeout(() => {
      if (!isRunning || isPaused) return;
      // Aqui mudaria a animação para expiração, mas o OrganicCircle já gerencia isso
    }, (breathDuration * 1000) / 2);

    // Próxima respiração
    breathingTimer.current = setTimeout(() => {
      if (!isRunning || isPaused) return;
      nextBreath();
    }, breathDuration * 1000);
  };

  const nextBreath = () => {
    if (currentBreath >= breathsPerRound) {
      // Round completado, iniciar retenção
      startHoldPhase();
    } else {
      setCurrentBreath(prev => prev + 1);
      startBreathingCycle();
    }
  };

  const startHoldPhase = async () => {
    console.log(`Iniciando retenção Round ${currentRound}`);
    
    setSessionPhase('holding');
    setHoldTime(0);
    holdStartTime.current = Date.now();
    
    // Notificar backend
    if (sessionId) {
      try {
        await ApiService.startHold(sessionId);
      } catch (error) {
        console.log('Erro ao notificar hold:', error);
      }
    }
    
    // Iniciar cronômetro
    holdTimer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - holdStartTime.current) / 1000);
      setHoldTime(elapsed);
    }, 1000);
  };

  const startRecovery = async () => {
    console.log(`Iniciando recuperação Round ${currentRound} - Hold: ${holdTime}s`);
    
    // Parar timer de hold
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    
    // Salvar tempo de hold
    const newHoldTime = {
      round: currentRound,
      hold: holdTime,
      recovery: 0,
    };
    setRoundHoldTimes(prev => [...prev, newHoldTime]);
    
    // Notificar backend
    if (sessionId) {
      try {
        await ApiService.endHold(sessionId, currentRound, holdTime);
      } catch (error) {
        console.log('Erro ao salvar hold:', error);
      }
    }
    
    // Iniciar recovery
    setSessionPhase('recovery');
    setRecoveryTime(0);
    recoveryStartTime.current = Date.now();
    
    recoveryTimer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recoveryStartTime.current) / 1000);
      setRecoveryTime(elapsed);
    }, 1000);
  };

  const endRecovery = async () => {
    console.log(`Finalizando recuperação Round ${currentRound}`);
    
    // Parar timer de recovery
    if (recoveryTimer.current) {
      clearInterval(recoveryTimer.current);
      recoveryTimer.current = null;
    }
    
    // Atualizar hold time com recovery
    setRoundHoldTimes(prev => 
      prev.map(item => 
        item.round === currentRound 
          ? { ...item, recovery: recoveryTime }
          : item
      )
    );
    
    // Notificar backend
    if (sessionId) {
      try {
        await ApiService.endRecovery(sessionId, currentRound, recoveryTime);
      } catch (error) {
        console.log('Erro ao salvar recovery:', error);
      }
    }
    
    // Verificar se é o último round
    if (currentRound >= rounds) {
      completeSession();
    } else {
      nextRound();
    }
  };

  const nextRound = () => {
    setCurrentRound(prev => prev + 1);
    setCurrentBreath(1);
    setSessionPhase('breathing');
    
    setTimeout(() => {
      if (isRunning) {
        startBreathingCycle();
      }
    }, 2000);
  };

  const completeSession = async () => {
    console.log('Sessão completada!');
    
    setIsRunning(false);
    clearAllTimers();
    
    // Notificar backend
    if (sessionId) {
      try {
        await ApiService.completeSession(sessionId);
      } catch (error) {
        console.log('Erro ao completar sessão:', error);
      }
    }
    
    // Navegar para tela de conclusão
    navigation.replace('SessionComplete', {
      rounds,
      holdTimes: roundHoldTimes,
      sessionId,
    });
  };

  const stopSession = () => {
    setIsRunning(false);
    clearAllTimers();
    navigation.goBack();
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    
    if (!isPaused) {
      // Pausando
      clearAllTimers();
    } else {
      // Retomando
      if (sessionPhase === 'breathing') {
        startBreathingCycle();
      } else if (sessionPhase === 'holding') {
        // Continuar hold timer
        holdStartTime.current = Date.now() - (holdTime * 1000);
        holdTimer.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - holdStartTime.current) / 1000);
          setHoldTime(elapsed);
        }, 1000);
      } else if (sessionPhase === 'recovery') {
        // Continuar recovery timer
        recoveryStartTime.current = Date.now() - (recoveryTime * 1000);
        recoveryTimer.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recoveryStartTime.current) / 1000);
          setRecoveryTime(elapsed);
        }, 1000);
      }
    }
  };

  const clearAllTimers = () => {
    if (breathingTimer.current) {
      clearTimeout(breathingTimer.current);
      breathingTimer.current = null;
    }
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    if (recoveryTimer.current) {
      clearInterval(recoveryTimer.current);
      recoveryTimer.current = null;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = () => {
    switch (sessionPhase) {
      case 'holding':
        return 'Retenção';
      case 'recovery':
        return 'Recuperação';
      default:
        return 'Respiração';
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header com informações */}
        <View style={styles.header}>
          <View style={styles.roundInfo}>
            <Text style={styles.roundText}>
              Round {currentRound} de {rounds}
            </Text>
          </View>
          <View style={styles.phaseInfo}>
            <Text style={styles.phaseText}>{getPhaseText()}</Text>
            {sessionPhase === 'breathing' && (
              <Text style={styles.breathText}>
                Respiração {currentBreath} de {breathsPerRound}
              </Text>
            )}
            {sessionPhase === 'holding' && (
              <Text style={styles.timerText}>
                Retenção: {formatTime(holdTime)}
              </Text>
            )}
            {sessionPhase === 'recovery' && (
              <Text style={styles.timerText}>
                Recuperação: {formatTime(recoveryTime)}
              </Text>
            )}
          </View>
        </View>

        {/* Círculo animado */}
        <View style={styles.circleContainer}>
          <OrganicCircle
            phase={sessionPhase === 'breathing' ? (currentBreath % 2 === 0 ? 'exhale' : 'inhale') : sessionPhase}
            breathNumber={sessionPhase === 'breathing' ? currentBreath : null}
            size={280}
            holdTime={holdTime}
          />
        </View>

        {/* Controles */}
        <View style={styles.controlsContainer}>
          {sessionPhase === 'breathing' && (
            <View style={styles.breathingControls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={togglePause}
              >
                <Text style={styles.controlButtonText}>
                  {isPaused ? 'Continuar' : 'Pausar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.controlButton, styles.stopButton]}
                onPress={stopSession}
              >
                <Text style={styles.controlButtonText}>Parar</Text>
              </TouchableOpacity>
            </View>
          )}

          {sessionPhase === 'holding' && (
            <View style={styles.holdControls}>
              <Text style={styles.instructionTitle}>Prenda a respiração!</Text>
              <Text style={styles.instructionText}>
                Segure o ar e mantenha-se relaxado
              </Text>
              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton]}
                onPress={startRecovery}
              >
                <Text style={styles.controlButtonText}>Respirar</Text>
              </TouchableOpacity>
            </View>
          )}

          {sessionPhase === 'recovery' && (
            <View style={styles.recoveryControls}>
              <Text style={styles.instructionTitle}>Respire fundo!</Text>
              <Text style={styles.instructionText}>
                Inspire profundamente e segure por 15 segundos
              </Text>
              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton]}
                onPress={endRecovery}
              >
                <Text style={styles.controlButtonText}>Soltar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Tempos dos rounds */}
        {roundHoldTimes.length > 0 && (
          <View style={styles.roundTimesContainer}>
            <Text style={styles.roundTimesTitle}>Tempos dos Rounds:</Text>
            {roundHoldTimes.map((roundTime, index) => (
              <Text key={index} style={styles.roundTimeText}>
                Round {roundTime.round}: {formatTime(roundTime.hold)}
                {roundTime.recovery > 0 && ` | Recuperação: ${formatTime(roundTime.recovery)}`}
              </Text>
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
  },
  roundInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  roundText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  phaseInfo: {
    alignItems: 'center',
  },
  phaseText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 5,
  },
  breathText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  timerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3498db',
    textShadowColor: 'rgba(52, 152, 219, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  circleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsContainer: {
    paddingBottom: 30,
  },
  breathingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  holdControls: {
    alignItems: 'center',
  },
  recoveryControls: {
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  controlButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
    minWidth: 120,
  },
  stopButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
    borderColor: 'rgba(255, 107, 107, 0.6)',
  },
  primaryButton: {
    backgroundColor: '#00b894',
    borderColor: '#00a085',
    paddingVertical: 15,
    paddingHorizontal: 40,
    minWidth: 150,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  roundTimesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  roundTimesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  roundTimeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 5,
    textAlign: 'center',
  },
});

export default BreathingSessionScreen;
