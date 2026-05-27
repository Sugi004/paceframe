import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false
  };

  static getDerivedStateFromError() {
    return {
      hasError: true
    };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  handleRetry = () => {
    this.setState({
      hasError: false
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <View style={styles.shell}>
            <View style={styles.card}>
              <Text style={styles.eyebrow}>PACEFRAME RECOVERY</Text>
              <Text style={styles.title}>Something slipped off course.</Text>
              <Text style={styles.body}>
                Paceframe hit an unexpected issue while loading this screen. Your saved state is still protected. Try re-opening the app view.
              </Text>
              <Pressable onPress={this.handleRetry} style={styles.button}>
                <Text style={styles.buttonLabel}>Try again</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#081124'
  },
  shell: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#081124'
  },
  card: {
    borderRadius: 30,
    backgroundColor: '#102347',
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#061024',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 12
    },
    elevation: 10
  },
  eyebrow: {
    color: '#8ed9ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10
  },
  title: {
    color: '#f7fbff',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    marginBottom: 12
  },
  body: {
    color: '#cfe1ff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  buttonLabel: {
    color: '#0f1730',
    fontWeight: '900'
  }
});
