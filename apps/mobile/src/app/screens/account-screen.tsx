import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { PaceframeLogo } from '../../components/paceframe-logo';
import { CareTracker, Card, PageIntro } from '../components/primitives';
import { formatWakeTime, WakeTimePicker } from '../components/wake-time-picker';
import { crashWindows, planningStyles } from '../constants';
import { styles } from '../styles';
import type { PaceframeAppController } from '../types';

type AccountScreenProps = Pick<
  PaceframeAppController,
  | 'user'
  | 'handleSignOut'
  | 'dashboard'
  | 'nextReminders'
  | 'syncStatus'
  | 'syncMessage'
  | 'retryCloudSync'
  | 'morningReminder'
  | 'retryMorningReminder'
  | 'updateProfileField'
  | 'setWakeTime'
  | 'setPlanningStyle'
  | 'setCrashWindow'
  | 'adjustCareTarget'
  | 'deleteAccountStatus'
  | 'deleteAccountMessage'
  | 'handleDeleteAccount'
>;

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatNextTrigger(value: string | null) {
  return value
    ? new Date(value).toLocaleString([], {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit'
      })
    : null;
}

export function AccountScreen({
  user,
  handleSignOut,
  dashboard,
  nextReminders,
  syncStatus,
  syncMessage,
  retryCloudSync,
  morningReminder,
  retryMorningReminder,
  updateProfileField,
  setWakeTime,
  setPlanningStyle,
  setCrashWindow,
  adjustCareTarget,
  deleteAccountStatus,
  deleteAccountMessage,
  handleDeleteAccount
}: AccountScreenProps) {
  const enabledReminders = nextReminders.length;
  const syncTone = syncStatus === 'setup' ? 'warm' : syncStatus === 'error' ? 'navy' : 'teal';
  const morningTone =
    morningReminder.status === 'scheduled'
      ? 'teal'
      : morningReminder.status === 'permission-needed'
        ? 'warm'
        : morningReminder.status === 'disabled' || morningReminder.status === 'error'
          ? 'navy'
          : 'light';
  const nextMorningTrigger = formatNextTrigger(morningReminder.nextTriggerAt);
  const syncLabel =
    syncStatus === 'setup'
      ? 'Setup needed'
      : syncStatus === 'synced'
        ? 'Connected'
        : syncStatus === 'syncing'
          ? 'Syncing'
          : syncStatus === 'error'
            ? 'Attention needed'
            : 'Idle';

  return (
    <View>
      <PageIntro
        title="Account and setup"
        subtitle="Identity, pacing preferences, and cloud connection live here so the rest of the app can stay focused on your actual day."
      />

      <Card title="Paceframe account" subtitle="Your current signed-in identity for mobile planning and recovery." tone="light">
        <View style={styles.accountPanelRow}>
          <View style={styles.accountIdentity}>
            <PaceframeLogo size={40} />
            <View>
              <Text style={styles.accountInlineLabel}>Signed in as</Text>
              <Text style={styles.accountInlineEmail}>{user?.email ?? 'Signed in user'}</Text>
            </View>
          </View>
          <Pressable onPress={handleSignOut} style={styles.accountButton}>
            <Text style={styles.accountButtonLabel}>Sign out</Text>
          </Pressable>
        </View>
      </Card>

      <Card
        title="Delete account"
        subtitle="Permanently remove this Firebase account, the synced cloud data behind it, and the local device cache."
        tone="warm"
      >
        <Text style={styles.deleteAccountBody}>
          This is permanent. Paceframe will cancel reminders, remove your synced dashboard and AI memory, then sign you out.
        </Text>

        <Pressable
          onPress={() =>
            Alert.alert(
              'Delete your Paceframe account?',
              'This will permanently remove your account, synced cloud data, and local device state. You can create a new account later if you want to return.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    void handleDeleteAccount();
                  }
                }
              ]
            )
          }
          disabled={deleteAccountStatus === 'working'}
          style={[styles.deleteAccountButton, deleteAccountStatus === 'working' ? styles.disabledButton : undefined]}
        >
          <Text style={styles.deleteAccountButtonLabel}>
            {deleteAccountStatus === 'working' ? 'Deleting...' : 'Delete account'}
          </Text>
        </Pressable>

        {deleteAccountMessage ? (
          <View style={styles.deleteAccountNotice}>
            <Text style={styles.deleteAccountNoticeText}>{deleteAccountMessage}</Text>
          </View>
        ) : null}
      </Card>

      <Card title="Cloud sync" subtitle={`Status: ${syncLabel}`} tone={syncTone}>
        <Text style={syncTone === 'navy' ? styles.inverseBody : styles.lightBody}>{syncMessage}</Text>

        {(syncStatus === 'setup' || syncStatus === 'error') ? (
          <View style={styles.inlineGuideStack}>
            {syncStatus === 'setup' ? (
              <>
                <View style={styles.simpleRow}>
                  <Text style={styles.listTitle}>1. Open your Supabase SQL editor</Text>
                  <Text style={styles.helperBody}>Run the dashboard-state migration in your live Supabase project.</Text>
                </View>
                <View style={styles.simpleRow}>
                  <Text style={styles.listTitle}>2. Run `0002_dashboard_state.sql`</Text>
                  <Text style={styles.helperBody}>That creates the `dashboard_states` table that Paceframe is trying to save into.</Text>
                </View>
                <View style={styles.simpleRow}>
                  <Text style={styles.listTitle}>3. Retry sync from this screen</Text>
                  <Text style={styles.helperBody}>Once the table exists, Paceframe can reconnect without you hunting through the app.</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.simpleRowDark}>
                  <Text style={styles.inverseTitle}>Check Firebase trust in Supabase</Text>
                  <Text style={styles.inverseBody}>Authentication / Third-Party Auth should include the matching Firebase project.</Text>
                </View>
                <View style={styles.simpleRowDark}>
                  <Text style={styles.inverseTitle}>Send a fresh token</Text>
                  <Text style={styles.inverseBody}>If Firebase is connected already, retry sync or sign back in so Supabase receives a fresh identity token.</Text>
                </View>
              </>
            )}
            <View style={styles.buttonRow}>
              <Pressable onPress={retryCloudSync} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonLabel}>Retry sync</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Card>

      <Card title="Morning reminder" subtitle={`Daily at ${formatWakeTime(dashboard.profile.wakeTime)}`} tone={morningTone}>
        <Text style={morningTone === 'navy' ? styles.inverseBody : styles.lightBody}>{morningReminder.message}</Text>
        {nextMorningTrigger ? <Text style={morningTone === 'navy' ? styles.inverseBody : styles.helperBody}>{`Next prompt: ${nextMorningTrigger}`}</Text> : null}

        {morningReminder.status === 'permission-needed' ? (
          <View style={styles.buttonRow}>
            <Pressable onPress={retryMorningReminder} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Enable notifications</Text>
            </Pressable>
          </View>
        ) : null}

        {morningReminder.status === 'disabled' ? (
          <View style={styles.buttonRow}>
            <Pressable onPress={() => void Linking.openSettings()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Open notification settings</Text>
            </Pressable>
          </View>
        ) : null}

        {morningReminder.status === 'error' ? (
          <View style={styles.buttonRow}>
            <Pressable onPress={retryMorningReminder} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonLabel}>Retry morning reminder</Text>
            </Pressable>
          </View>
        ) : null}
      </Card>

      <Card title="Pacing preferences" subtitle="These choices tell Paceframe how protective or aggressive the system should feel when it shapes your day." tone="warm">
        <Text style={styles.fieldLabel}>First name</Text>
        <TextInput
          value={dashboard.profile.firstName}
          onChangeText={(value) => updateProfileField('firstName', value)}
          placeholder="How should Paceframe address you?"
          placeholderTextColor="#7f8aa3"
          style={styles.settingsInput}
        />

        <Text style={styles.fieldLabel}>Role</Text>
        <TextInput
          value={dashboard.profile.roleLabel}
          onChangeText={(value) => updateProfileField('roleLabel', value)}
          placeholder="Founder, creator, operator..."
          placeholderTextColor="#7f8aa3"
          style={styles.settingsInput}
        />

        <Text style={styles.fieldLabel}>Primary goal</Text>
        <TextInput
          value={dashboard.profile.primaryGoal}
          onChangeText={(value) => updateProfileField('primaryGoal', value)}
          placeholder="What should Paceframe help you protect?"
          placeholderTextColor="#7f8aa3"
          multiline
          style={styles.textArea}
        />

        <WakeTimePicker value={dashboard.profile.wakeTime} onChange={setWakeTime} />

        <Text style={styles.fieldLabel}>Planning style</Text>
        <View style={styles.segmentRow}>
          {planningStyles.map((style) => (
            <Pressable
              key={style}
              onPress={() => setPlanningStyle(style)}
              style={[styles.segment, dashboard.profile.planningStyle === style ? styles.segmentActive : undefined]}
            >
              <Text style={[styles.segmentLabel, dashboard.profile.planningStyle === style ? styles.segmentLabelActive : undefined]}>
                {labelize(style)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Crash window</Text>
        <View style={styles.segmentRow}>
          {crashWindows.map((window) => (
            <Pressable
              key={window}
              onPress={() => setCrashWindow(window)}
              style={[styles.segment, dashboard.profile.crashWindow === window ? styles.segmentActive : undefined]}
            >
              <Text style={[styles.segmentLabel, dashboard.profile.crashWindow === window ? styles.segmentLabelActive : undefined]}>
                {labelize(window)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card title="Baseline care targets" subtitle="These are your base expectations, separate from today’s progress, and they drive the care score in Overview." tone="lime">
        <CareTracker label="Meals target" value={`${dashboard.carePlan.mealsTarget}`} onMinus={() => adjustCareTarget('mealsTarget', -1)} onPlus={() => adjustCareTarget('mealsTarget', 1)} />
        <CareTracker label="Water target" value={`${dashboard.carePlan.hydrationTarget}`} onMinus={() => adjustCareTarget('hydrationTarget', -1)} onPlus={() => adjustCareTarget('hydrationTarget', 1)} />
        <CareTracker label="Movement target" value={`${dashboard.carePlan.movementTarget}`} onMinus={() => adjustCareTarget('movementTarget', -1)} onPlus={() => adjustCareTarget('movementTarget', 1)} />
        <CareTracker label="Rest target" value={`${dashboard.carePlan.restTarget}`} onMinus={() => adjustCareTarget('restTarget', -1)} onPlus={() => adjustCareTarget('restTarget', 1)} />
      </Card>

      <Card title="System snapshot" subtitle="A quick read on what this account is currently shaping." tone="light">
        <View style={styles.metricsGrid}>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>Focus mode</Text>
            <Text style={styles.metricPillValue}>{dashboard.energyState.focusLabel}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>Routine count</Text>
            <Text style={styles.metricPillValue}>{`${dashboard.routines.length}`}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>Live reminders</Text>
            <Text style={styles.metricPillValue}>{`${enabledReminders}`}</Text>
          </View>
          <View style={styles.metricPill}>
            <Text style={styles.metricPillLabel}>Energy mode</Text>
            <Text style={styles.metricPillValue}>{dashboard.energyState.energy}</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}
