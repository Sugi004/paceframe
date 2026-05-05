import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { styles } from '../styles';
import type { Tab } from '../types';

const transitionCopy: Record<Tab, { eyebrow: string; title: string; body: string }> = {
  overview: {
    eyebrow: 'Loading today',
    title: 'Reframing the day around your current state',
    body: 'Gathering your energy, tasks, and recovery signals.'
  },
  assistant: {
    eyebrow: 'Opening coach',
    title: 'Preparing the AI planning room',
    body: 'Loading the live conversation layer and today’s context.'
  },
  plan: {
    eyebrow: 'Loading plan',
    title: 'Reordering the day by energy fit',
    body: 'Bringing your most realistic next moves forward.'
  },
  checkin: {
    eyebrow: 'Loading signals',
    title: 'Bringing your real-time signals into view',
    body: 'Preparing strain, care, and reminder controls.'
  },
  reset: {
    eyebrow: 'Loading recovery',
    title: 'Shifting into lower-friction recovery mode',
    body: 'Opening your recovery blocks and calmer sequence.'
  },
  account: {
    eyebrow: 'Loading setup',
    title: 'Bringing your preferences and sync state in',
    body: 'Preparing account, pacing defaults, and cloud status.'
  }
};

export function ScreenTransition({ tab }: { tab: Tab }) {
  const fade = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(18)).current;
  const shimmer = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true
      }),
      Animated.spring(lift, {
        toValue: 0,
        friction: 9,
        tension: 55,
        useNativeDriver: true
      })
    ]).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(shimmer, {
          toValue: 0.55,
          duration: 700,
          useNativeDriver: true
        })
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, [fade, lift, shimmer]);

  const copy = transitionCopy[tab];

  return (
    <Animated.View style={[styles.transitionOverlay, { opacity: fade }]}>
      <Animated.View
        style={[
          styles.transitionCard,
          {
            transform: [{ translateY: lift }]
          }
        ]}
      >
        <View style={styles.transitionOrbLarge} />
        <View style={styles.transitionOrbSmall} />
        <Text style={styles.transitionEyebrow}>{copy.eyebrow}</Text>
        <Text style={styles.transitionTitle}>{copy.title}</Text>
        <Text style={styles.transitionBody}>{copy.body}</Text>
        <View style={styles.transitionBarStack}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.transitionBar,
                {
                  opacity: shimmer,
                  transform: [
                    {
                      scaleX: shimmer.interpolate({
                        inputRange: [0.55, 1],
                        outputRange: [0.92, 1]
                      })
                    }
                  ]
                }
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
