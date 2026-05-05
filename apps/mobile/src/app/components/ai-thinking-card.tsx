import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../styles';

export function AIThinkingCard() {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true
        })
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [pulse]);

  return (
    <View style={styles.aiThinkingCard}>
      <Text style={styles.aiThinkingEyebrow}>Paceframe AI</Text>
      <Text style={styles.aiThinkingTitle}>Analyzing your state and shaping a calmer answer</Text>
      <Text style={styles.aiThinkingBody}>Comparing task load, burnout risk, care gaps, and recovery timing before answering.</Text>
      <View style={styles.aiThinkingBarStack}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.aiThinkingBar,
              {
                opacity: pulse,
                transform: [
                  {
                    scaleX: pulse.interpolate({
                      inputRange: [0.45, 1],
                      outputRange: [0.9, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}
