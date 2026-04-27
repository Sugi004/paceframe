import { Pressable, Text, TextInput, View } from 'react-native';
import { PaceframeLogo } from '../../components/paceframe-logo';
import type { AuthMode, AuthStatus } from '../types';
import { styles } from '../styles';

export function AuthFrontPage({
  authMode,
  email,
  password,
  message,
  status,
  authReady,
  onModeChange,
  onEmailChange,
  onPasswordChange,
  onSubmit
}: {
  authMode: AuthMode;
  email: string;
  password: string;
  message: string;
  status: AuthStatus;
  authReady: boolean;
  onModeChange: (mode: AuthMode) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const title =
    authMode === 'signup'
      ? 'A calmer system for work, care, and recovery.'
      : authMode === 'signin'
        ? 'Welcome back to your steadier pace.'
        : 'Recover access without losing your rhythm.';

  const subtitle =
    authMode === 'signup'
      ? 'Paceframe helps you organize tasks, reminders, meals, rest, and burnout recovery in one mobile-first flow.'
      : authMode === 'signin'
        ? 'Sign in to reopen your pace-aware planner, daily check-ins, and recovery guidance.'
        : 'Reset your password and get back into the product quickly.';

  return (
    <View>
      <View style={styles.authHeroCard}>
        <View style={styles.authBrandRow}>
          <PaceframeLogo size={62} />
          <View style={styles.authBrandCopy}>
            <Text style={styles.authEyebrow}>PACEFRAME</Text>
            <Text style={styles.authBrandTitle}>Plan by energy. Recover before burnout.</Text>
          </View>
        </View>

        <Text style={styles.authTitle}>{title}</Text>
        <Text style={styles.authSubtitle}>{subtitle}</Text>

        <View style={styles.authChips}>
          <View style={[styles.heroChip, styles.heroChipWarm]}>
            <Text style={styles.heroChipLabel}>AI guidance</Text>
          </View>
          <View style={[styles.heroChip, styles.heroChipCool]}>
            <Text style={styles.heroChipLabel}>burnout tracking</Text>
          </View>
          <View style={[styles.heroChip, styles.heroChipWarning]}>
            <Text style={styles.heroChipLabel}>care reminders</Text>
          </View>
        </View>

        <View style={styles.authFeatureGrid}>
          <View style={styles.authFeatureCard}>
            <Text style={styles.authFeatureLabel}>Built for</Text>
            <Text style={styles.authFeatureValue}>founders, creators, operators</Text>
          </View>
          <View style={styles.authFeatureCard}>
            <Text style={styles.authFeatureLabel}>Core promise</Text>
            <Text style={styles.authFeatureValue}>less pressure, clearer pacing</Text>
          </View>
        </View>
      </View>

      <View style={styles.authPanelCard}>
        <Text style={styles.authPanelEyebrow}>Account access</Text>
        <View style={styles.authModeRow}>
          {(['signup', 'signin', 'reset'] as AuthMode[]).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => onModeChange(mode)}
              style={[styles.authModeChip, authMode === mode ? styles.authModeChipActive : undefined]}
            >
              <Text style={[styles.authModeChipLabel, authMode === mode ? styles.authModeChipLabelActive : undefined]}>
                {mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Reset'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          value={email}
          onChangeText={onEmailChange}
          placeholder="you@example.com"
          placeholderTextColor="#7f8aa3"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.authInput}
        />

        {authMode !== 'reset' ? (
          <>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              value={password}
              onChangeText={onPasswordChange}
              placeholder="At least 6 characters"
              placeholderTextColor="#7f8aa3"
              secureTextEntry
              style={styles.authInput}
            />
          </>
        ) : null}

        <Pressable onPress={onSubmit} disabled={!authReady || status === 'working'} style={[styles.primaryButton, !authReady ? styles.disabledButton : undefined]}>
          <Text style={styles.primaryButtonLabel}>
            {status === 'working'
              ? 'Working...'
              : authMode === 'signup'
                ? 'Create account'
                : authMode === 'signin'
                  ? 'Sign in'
                  : 'Send reset email'}
          </Text>
        </Pressable>

        <View style={styles.authMessageCard}>
          <Text style={styles.authMessageText}>
            {authReady ? message : 'Firebase mobile auth is not configured yet. Add the Expo Firebase values in `.env` to activate sign in.'}
          </Text>
        </View>
      </View>

      <View style={styles.authSupportCard}>
        <Text style={styles.authSupportTitle}>What opens after sign in</Text>
        <Text style={styles.authSupportBody}>
          Your daily planner, check-ins, recovery protocols, reminder controls, and AI coaching all live inside the mobile product.
        </Text>
      </View>
    </View>
  );
}
