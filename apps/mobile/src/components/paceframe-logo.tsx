import { StyleSheet, View } from 'react-native';

export function PaceframeLogo({ size = 58 }: { size?: number }) {
  const beamLength = Math.max(18, Math.round(size * 0.36));
  const beamThickness = Math.max(8, Math.round(size * 0.16));
  const coreSize = Math.max(20, Math.round(size * 0.42));

  return (
    <View style={[styles.shell, { width: size, height: size }]}>
      <View style={[styles.core, { width: coreSize, height: coreSize, borderRadius: coreSize / 2 }]} />
      <View style={[styles.beam, styles.topBeam, { width: beamThickness, height: beamLength, borderRadius: beamThickness / 2 }]} />
      <View style={[styles.beam, styles.rightBeam, { width: beamLength, height: beamThickness, borderRadius: beamThickness / 2 }]} />
      <View style={[styles.beam, styles.bottomBeam, { width: beamThickness, height: beamLength, borderRadius: beamThickness / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  core: {
    backgroundColor: '#0d1834',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#ff7d4a',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8
    },
    elevation: 8
  },
  beam: {
    position: 'absolute',
    backgroundColor: '#ffd36e'
  },
  topBeam: {
    top: 0
  },
  rightBeam: {
    right: 0
  },
  bottomBeam: {
    bottom: 0
  }
});
