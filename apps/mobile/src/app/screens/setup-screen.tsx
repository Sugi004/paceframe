import { Pressable, Text, TextInput, View } from 'react-native';
import { CareTracker, Card, PageIntro } from '../components/primitives';
import { crashWindows, planningStyles } from '../constants';
import { styles } from '../styles';
import type { PaceframeAppController } from '../types';

type SetupScreenProps = Pick<
  PaceframeAppController,
  'dashboard' | 'updateProfileField' | 'setPlanningStyle' | 'setCrashWindow' | 'adjustCareTarget' | 'completeOnboarding'
>;

function labelize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function SetupScreen({
  dashboard,
  updateProfileField,
  setPlanningStyle,
  setCrashWindow,
  adjustCareTarget,
  completeOnboarding
}: SetupScreenProps) {
  const canContinue = dashboard.profile.firstName.trim().length > 0 && dashboard.profile.roleLabel.trim().length > 0;

  return (
    <View>
      <PageIntro
        title="Shape Paceframe around you"
        subtitle="Take one minute to set your pacing defaults so planning and recovery suggestions feel personal from day one."
      />

      <Card title="Who is this setup for?" subtitle="These details help the product speak to your day like a real operating system, not a generic task app." tone="light">
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
          placeholder="What should Paceframe help you protect or achieve?"
          placeholderTextColor="#7f8aa3"
          multiline
          style={styles.textArea}
        />
      </Card>

      <Card title="How should planning feel?" subtitle="Choose the pace logic that should shape how tasks are ranked and how recovery gets protected." tone="warm">
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
        <Text style={styles.helperBody}>Protective favors lower-friction work when stress is high. Ambitious gives meaningful work a stronger push.</Text>

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
        <Text style={styles.helperBody}>Paceframe uses this to place recovery blocks before the part of the day where you usually lose momentum.</Text>
      </Card>

      <Card title="Set your baseline care targets" subtitle="These are the minimum anchors the app will protect while it plans your day." tone="teal">
        <CareTracker label="Meals target" value={`${dashboard.carePlan.mealsTarget}`} onMinus={() => adjustCareTarget('mealsTarget', -1)} onPlus={() => adjustCareTarget('mealsTarget', 1)} />
        <CareTracker label="Water target" value={`${dashboard.carePlan.hydrationTarget}`} onMinus={() => adjustCareTarget('hydrationTarget', -1)} onPlus={() => adjustCareTarget('hydrationTarget', 1)} />
        <CareTracker label="Movement target" value={`${dashboard.carePlan.movementTarget}`} onMinus={() => adjustCareTarget('movementTarget', -1)} onPlus={() => adjustCareTarget('movementTarget', 1)} />
        <CareTracker label="Rest target" value={`${dashboard.carePlan.restTarget}`} onMinus={() => adjustCareTarget('restTarget', -1)} onPlus={() => adjustCareTarget('restTarget', 1)} />
      </Card>

      <Pressable onPress={completeOnboarding} disabled={!canContinue} style={[styles.primaryButton, !canContinue ? styles.disabledButton : undefined, styles.setupPrimaryButton]}>
        <Text style={styles.primaryButtonLabel}>Enter Paceframe</Text>
      </Pressable>
    </View>
  );
}
