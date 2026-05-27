import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type AnimatedPaceframeLogoProps = {
  size?: number;
};

export function AnimatedPaceframeLogo({ size = 108 }: AnimatedPaceframeLogoProps) {
  const beamLength = Math.max(32, Math.round(size * 0.36));
  const beamThickness = Math.max(12, Math.round(size * 0.14));
  const coreSize = Math.max(34, Math.round(size * 0.42));

  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const beamDrift = useRef(new Animated.Value(0)).current;
  const haloSpin = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, {
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          }),
          Animated.timing(float, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true
          })
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true
          })
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(beamDrift, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(beamDrift, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true
          })
        ])
      ),
      Animated.loop(
        Animated.timing(haloSpin, {
          toValue: 1,
          duration: 7200,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          }),
          Animated.delay(700)
        ])
      )
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [beamDrift, float, haloSpin, pulse, shimmer]);

  return (
    <View style={[styles.frame, { width: size * 1.9, height: size * 1.9 }]}>
      <Animated.View
        style={[
          styles.orb,
          styles.orbCool,
          {
            width: size * 1.45,
            height: size * 1.45,
            borderRadius: size,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.18, 0.32]
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.88, 1.04]
                })
              }
            ]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orbWarm,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: size,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [0.14, 0.24]
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.12]
                })
              }
            ]
          }
        ]}
      />

      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: size,
            transform: [
              {
                rotate: haloSpin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                })
              }
            ]
          }
        ]}
      />

      <Animated.View
        style={[
          styles.logoShell,
          {
            width: size,
            height: size,
            borderRadius: size * 0.34,
            transform: [
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [3, -5]
                })
              },
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02]
                })
              }
            ]
          }
        ]}
      >
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: size * 0.34,
              height: size * 1.28,
              borderRadius: size * 0.18,
              transform: [
                { rotate: '22deg' },
                {
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-size * 0.92, size * 0.92]
                  })
                }
              ]
            }
          ]}
        />

        <View style={[styles.core, { width: coreSize, height: coreSize, borderRadius: coreSize / 2 }]} />

        <Animated.View
          style={[
            styles.beam,
            styles.topBeam,
            {
              width: beamThickness,
              height: beamLength,
              borderRadius: beamThickness / 2,
              transform: [
                {
                  translateY: beamDrift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-3, 3]
                  })
                }
              ]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.beam,
            styles.rightBeam,
            {
              width: beamLength,
              height: beamThickness,
              borderRadius: beamThickness / 2,
              transform: [
                {
                  translateX: beamDrift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, -3]
                  })
                }
              ]
            }
          ]}
        />
        <Animated.View
          style={[
            styles.beam,
            styles.bottomBeam,
            {
              width: beamThickness,
              height: beamLength,
              borderRadius: beamThickness / 2,
              transform: [
                {
                  translateY: beamDrift.interpolate({
                    inputRange: [0, 1],
                    outputRange: [3, -3]
                  })
                }
              ]
            }
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  orb: {
    position: 'absolute'
  },
  orbCool: {
    backgroundColor: 'rgba(94, 220, 255, 0.28)'
  },
  orbWarm: {
    backgroundColor: 'rgba(255, 194, 102, 0.3)'
  },
  halo: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(155, 226, 255, 0.22)',
    borderTopColor: 'rgba(255, 210, 107, 0.74)',
    borderRightColor: 'rgba(155, 226, 255, 0.5)'
  },
  logoShell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#14254f',
    borderWidth: 1,
    borderColor: 'rgba(201, 233, 255, 0.24)',
    shadowColor: '#050c1d',
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 18
    },
    elevation: 18
  },
  shimmer: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.12)'
  },
  core: {
    backgroundColor: '#081229',
    borderWidth: 4,
    borderColor: 'rgba(241, 248, 255, 0.88)',
    shadowColor: '#ff9a4f',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10
    },
    elevation: 10
  },
  beam: {
    position: 'absolute',
    backgroundColor: '#ffd36e'
  },
  topBeam: {
    top: 10
  },
  rightBeam: {
    right: 10
  },
  bottomBeam: {
    bottom: 10
  }
});
