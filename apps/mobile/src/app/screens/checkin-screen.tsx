import { Pressable, Text, View } from 'react-native';
import type { PaceframeAppController } from '../types';
import { Card, CareTracker, MetricControl, PageIntro, ReflectionField } from '../components/primitives';
import { styles } from '../styles';

type CheckInScreenProps = Pick<
  PaceframeAppController,
  'dashboard' | 'adjustSleepTrouble' | 'adjustEnergy' | 'adjustCareMetric' | 'toggleReminderEnabled' | 'shiftReminder' | 'updateReflectionField'
>;

export function CheckInScreen({
  dashboard,
  adjustSleepTrouble,
  adjustEnergy,
  adjustCareMetric,
  toggleReminderEnabled,
  shiftReminder,
  updateReflectionField
}: CheckInScreenProps) {
  return (
    <View>
      <PageIntro
        title="Check in with yourself"
        subtitle="Update your current strain level, care basics, reminders, and reflection so Paceframe reacts to your real state."
      />

      <Card title="Live check-in" subtitle="For burnout inputs, higher means more strain on your system." tone="teal">
        <MetricControl label="Sleep trouble" value={11 - dashboard.checkIn.sleepQuality} onMinus={() => adjustSleepTrouble(-1)} onPlus={() => adjustSleepTrouble(1)} />
        <MetricControl label="Stress load" value={dashboard.checkIn.stressLevel} onMinus={() => adjustEnergy('stressLevel', -1)} onPlus={() => adjustEnergy('stressLevel', 1)} />
        <MetricControl label="Screen fatigue" value={dashboard.checkIn.screenFatigue} onMinus={() => adjustEnergy('screenFatigue', -1)} onPlus={() => adjustEnergy('screenFatigue', 1)} />
      </Card>

      <Card title="Daily care targets" subtitle="These are the basics the app keeps asking you not to sacrifice." tone="light">
        <CareTracker label="Meals" value={`${dashboard.carePlan.mealsDone}/${dashboard.carePlan.mealsTarget}`} onMinus={() => adjustCareMetric('mealsDone', -1)} onPlus={() => adjustCareMetric('mealsDone', 1)} />
        <CareTracker label="Water" value={`${dashboard.carePlan.hydrationDone}/${dashboard.carePlan.hydrationTarget}`} onMinus={() => adjustCareMetric('hydrationDone', -1)} onPlus={() => adjustCareMetric('hydrationDone', 1)} />
        <CareTracker label="Movement" value={`${dashboard.carePlan.movementDone}/${dashboard.carePlan.movementTarget}`} onMinus={() => adjustCareMetric('movementDone', -1)} onPlus={() => adjustCareMetric('movementDone', 1)} />
        <CareTracker label="Rest blocks" value={`${dashboard.carePlan.restDone}/${dashboard.carePlan.restTarget}`} onMinus={() => adjustCareMetric('restDone', -1)} onPlus={() => adjustCareMetric('restDone', 1)} />
      </Card>

      <Card title="Reminder controls" subtitle="Toggle prompts on or off and shift their times in 30-minute steps." tone="warm">
        {dashboard.reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderControlCard}>
            <View style={styles.reminderHeader}>
              <View style={styles.listText}>
                <Text style={styles.listTitle}>{reminder.title}</Text>
                <Text style={styles.listMeta}>{reminder.note}</Text>
              </View>
              <Pressable onPress={() => toggleReminderEnabled(reminder.id)} style={[styles.badge, reminder.enabled ? styles.badgeDone : styles.badgeMuted]}>
                <Text style={styles.badgeLabel}>{reminder.enabled ? 'On' : 'Off'}</Text>
              </Pressable>
            </View>
            <View style={styles.timeAdjustRow}>
              <Pressable onPress={() => shiftReminder(reminder.id, -1)} style={styles.timeAdjustButton}>
                <Text style={styles.timeAdjustLabel}>-30m</Text>
              </Pressable>
              <Text style={styles.reminderTimeDark}>{reminder.time}</Text>
              <Pressable onPress={() => shiftReminder(reminder.id, 1)} style={styles.timeAdjustButton}>
                <Text style={styles.timeAdjustLabel}>+30m</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>

      <Card title="Reflection + AI memory" subtitle="What you write here helps the app make smarter recommendations later." tone="light">
        <ReflectionField
          label="Today&apos;s intention"
          value={dashboard.reflection.intention}
          placeholder="What matters most today?"
          onChangeText={(value) => updateReflectionField('intention', value)}
        />
        <ReflectionField
          label="Evening note"
          value={dashboard.reflection.eveningNote}
          placeholder="What drained you or helped you today?"
          onChangeText={(value) => updateReflectionField('eveningNote', value)}
        />
        <ReflectionField
          label="Gratitude"
          value={dashboard.reflection.gratitude}
          placeholder="What felt grounding or good?"
          onChangeText={(value) => updateReflectionField('gratitude', value)}
        />
      </Card>
    </View>
  );
}
