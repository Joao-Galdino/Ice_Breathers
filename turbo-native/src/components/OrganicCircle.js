import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const OrganicCircle = ({ phase, breathNumber, size = 200, holdTime = 0 }) => {
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.85)).current;
  const scaleAnim3 = useRef(new Animated.Value(0.7)).current;
  const opacityAnim1 = useRef(new Animated.Value(0.9)).current;
  const opacityAnim2 = useRef(new Animated.Value(0.7)).current;
  const opacityAnim3 = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    switch (phase) {
      case 'inhale':
        animateInhale();
        break;
      case 'exhale':
        animateExhale();
        break;
      case 'holding':
        animateHolding();
        break;
      case 'recovery':
        animateRecovery();
        break;
      default:
        resetAnimation();
    }
  }, [phase]);

  // Animação de crescimento durante hold
  useEffect(() => {
    if (phase === 'holding' && holdTime > 0) {
      const growthFactor = Math.min(1 + (holdTime * 0.007), 1.4);
      
      Animated.parallel([
        Animated.timing(scaleAnim1, {
          toValue: growthFactor,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim2, {
          toValue: 0.85 * (growthFactor - 0.03),
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim3, {
          toValue: 0.7 * (growthFactor - 0.06),
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [holdTime, phase]);

  const animateInhale = () => {
    Animated.parallel([
      Animated.timing(scaleAnim1, {
        toValue: 1.3,
        duration: 1775, // metade de 3.55s
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim2, {
        toValue: 0.85 * 1.3,
        duration: 1775,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim3, {
        toValue: 0.7 * 1.3,
        duration: 1775,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim1, {
        toValue: 1,
        duration: 1775,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateExhale = () => {
    Animated.parallel([
      Animated.timing(scaleAnim1, {
        toValue: 0.8,
        duration: 1775,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim2, {
        toValue: 0.85 * 0.8,
        duration: 1775,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim3, {
        toValue: 0.7 * 0.8,
        duration: 1775,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim1, {
        toValue: 0.7,
        duration: 1775,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateHolding = () => {
    // Animação pulsante para holding
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim1, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim1, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseAnimation.start();
  };

  const animateRecovery = () => {
    // Animação pulsante mais rápida para recovery
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim1, {
            toValue: 1.2,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim1, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim1, {
            toValue: 1,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim1, {
            toValue: 0.8,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    pulseAnimation.start();
  };

  const resetAnimation = () => {
    Animated.parallel([
      Animated.timing(scaleAnim1, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim2, {
        toValue: 0.85,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim3, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim1, {
        toValue: 0.9,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim2, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim3, {
        toValue: 0.5,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getColors = () => {
    switch (phase) {
      case 'holding':
        return {
          layer1: ['#ADD8E6', '#87CEEB'],
          layer2: ['#87CEEB', '#4682B4'],
          layer3: ['#4682B4', '#2F4F4F'],
        };
      case 'recovery':
        return {
          layer1: ['#90EE90', '#66CDAA'],
          layer2: ['#66CDAA', '#3CB371'],
          layer3: ['#3CB371', '#228B22'],
        };
      default:
        return {
          layer1: ['#FFF8E1', '#FFDA7A'],
          layer2: ['#FFDA7A', '#FF9843'],
          layer3: ['#FF9843', '#FF6B35'],
        };
    }
  };

  const colors = getColors();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Camada 3 - Fundo */}
      <Animated.View
        style={[
          styles.circle,
          styles.layer3,
          {
            transform: [{ scale: scaleAnim3 }],
            opacity: opacityAnim3,
          },
        ]}
      >
        <LinearGradient
          colors={colors.layer3}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Camada 2 - Meio */}
      <Animated.View
        style={[
          styles.circle,
          styles.layer2,
          {
            transform: [{ scale: scaleAnim2 }],
            opacity: opacityAnim2,
          },
        ]}
      >
        <LinearGradient
          colors={colors.layer2}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Camada 1 - Frente */}
      <Animated.View
        style={[
          styles.circle,
          styles.layer1,
          {
            transform: [{ scale: scaleAnim1 }],
            opacity: opacityAnim1,
          },
        ]}
      >
        <LinearGradient
          colors={colors.layer1}
          style={styles.gradient}
        />
        
        {/* Número da respiração ou ícone */}
        <View style={styles.centerContent}>
          {breathNumber && (
            <Animated.Text style={styles.breathNumber}>
              {phase === 'holding' ? '⏱️' : phase === 'recovery' ? '🫁' : breathNumber}
            </Animated.Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  layer1: {
    zIndex: 3,
  },
  layer2: {
    zIndex: 2,
  },
  layer3: {
    zIndex: 1,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breathNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#8B4513',
    textShadowColor: 'rgba(139, 69, 19, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
});

export default OrganicCircle;
