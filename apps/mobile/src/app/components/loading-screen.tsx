import { StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from '../styles';

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingEyebrow}>PACEFRAME</Text>
        <Text style={styles.loadingTitle}>Loading your day...</Text>
      </View>
    </SafeAreaView>
  );
}
