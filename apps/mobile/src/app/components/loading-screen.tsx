import { useEffect, useRef } from 'react';
import { Animated, Easing, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPaceframeLogo } from './animated-paceframe-logo';

export function LoadingScreen() {
  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const beam = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 3200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(beam, {
            toValue: 1,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(beam, {
            toValue: 0,
            duration: 2400,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      )
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [beam, fade, float]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.screen}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientOrb,
            styles.ambientOrbCool,
            {
              transform: [
                {
                  translateY: float.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 12]
                  })
                },
                {
                  translateX: beam.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 12]
                  })
                }
              ]
            }
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientOrb,
            styles.ambientOrbWarm,
            {
              transform: [
                {
                  translateY: float.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, -10]
                  })
                },
                {
                  translateX: beam.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, -14]
                  })
                }
              ]
            }
          ]}
        />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fade,
              transform: [
                {
                  translateY: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [24, 0]
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.eyebrow}>PACEFRAME</Text>
          <View style={styles.logoWrap}>
            <AnimatedPaceframeLogo size={116} />
          </View>
          <Text style={styles.title}>Opening your day with a steadier pace.</Text>
          <Text style={styles.body}>
            Syncing your signals, reminders, and today&apos;s safest high-impact plan.
          </Text>

          <View style={styles.launchPillRow}>
            <View style={[styles.launchPill, styles.launchPillCool]}>
              <Text style={styles.launchPillText}>signals</Text>
            </View>
            <View style={[styles.launchPill, styles.launchPillWarm]}>
              <Text style={styles.launchPillText}>recovery</Text>
            </View>
            <View style={[styles.launchPill, styles.launchPillSand]}>
              <Text style={styles.launchPillText}>plan</Text>
            </View>
          </View>

          <View style={styles.statusRail}>
            <Animated.View
              style={[
                styles.statusFill,
                {
                  transform: [
                    {
                      translateX: beam.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-74, 74]
                      })
                    }
                  ]
                }
              ]}
            />
          </View>

          <Text style={styles.caption}>Calibrating energy, burnout, and your next best move.</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081124'
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    overflow: 'hidden',
    backgroundColor: '#081124'
  },
  ambientOrb: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.28
  },
  ambientOrbCool: {
    top: 112,
    left: -40,
    backgroundColor: '#1d5d9f'
  },
  ambientOrbWarm: {
    right: -58,
    bottom: 118,
    backgroundColor: '#8f5d24'
  },
  content: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 30,
    borderRadius: 36,
    backgroundColor: 'rgba(8, 17, 36, 0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#020816',
    shadowOpacity: 0.34,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10
  },
  eyebrow: {
    marginBottom: 16,
    color: '#8fd8ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 3.2
  },
  logoWrap: {
    marginBottom: 26
  },
  title: {
    maxWidth: 320,
    color: '#f7fbff',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center'
  },
  body: {
    maxWidth: 320,
    marginTop: 14,
    color: '#9bb0cf',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center'
  },
  launchPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 22
  },
  launchPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1
  },
  launchPillCool: {
    backgroundColor: 'rgba(142, 217, 255, 0.12)',
    borderColor: 'rgba(142, 217, 255, 0.24)'
  },
  launchPillWarm: {
    backgroundColor: 'rgba(255, 107, 61, 0.12)',
    borderColor: 'rgba(255, 107, 61, 0.24)'
  },
  launchPillSand: {
    backgroundColor: 'rgba(255, 211, 110, 0.12)',
    borderColor: 'rgba(255, 211, 110, 0.24)'
  },
  launchPillText: {
    color: '#f6fbff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase'
  },
  statusRail: {
    width: 160,
    height: 8,
    marginTop: 28,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.08)'
  },
  statusFill: {
    width: 72,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ffd36e'
  },
  caption: {
    maxWidth: 280,
    marginTop: 16,
    color: '#6e84a7',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  }
});
