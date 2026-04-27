import { Pressable, Text, View } from 'react-native';
import type { PaceframeAppController } from '../types';
import { Card, MetricPill, SummaryItem } from '../components/primitives';
import { HeroCard } from '../components/hero-card';
import { styles } from '../styles';

type OverviewScreenProps = Pick<
  PaceframeAppController,
  'dashboard' | 'careConsistency' | 'weeklyInsight' | 'dailyBrief' | 'aiCoach' | 'nextReminders' | 'weeklySummary' | 'burnoutSignal' | 'plan' | 'aiStatus' | 'aiMessage' | 'retryLiveCoaching'
>;

export function OverviewScreen({
  dashboard,
  careConsistency,
  weeklyInsight,
  dailyBrief,
  aiCoach,
  nextReminders,
  weeklySummary,
  burnoutSignal,
  plan,
  aiStatus,
  aiMessage,
  retryLiveCoaching
}: OverviewScreenProps) {
  const topTask = plan.prioritizedTasks[0];
  const essentials = plan.essentials.slice(0, 3);

  return (
    <View>
      <HeroCard
        firstName={dashboard.profile.firstName}
        primaryGoal={dashboard.profile.primaryGoal}
        focusLabel={dashboard.energyState.focusLabel}
        burnoutLevel={burnoutSignal.level}
        burnoutScore={burnoutSignal.score}
        burnoutSummary={burnoutSignal.summary}
        careConsistency={careConsistency}
      />

      <Card title="Today at a glance" subtitle="Read your current state, then shape the day around your actual capacity." tone="light">
        <View style={styles.metricsGrid}>
          <MetricPill label="Energy" value={dashboard.energyState.energy} />
          <MetricPill label="Sleep" value={`${dashboard.energyState.sleepQuality}/10`} />
          <MetricPill label="Stress" value={`${dashboard.energyState.stressLevel}/10`} />
          <MetricPill label="Care score" value={`${careConsistency}%`} />
        </View>
      </Card>

      <Card
        title="Your next best move"
        subtitle={topTask ? 'The planner is recommending a single task to anchor the day.' : 'No task is currently ahead of the rest.'}
        tone="warm"
      >
        <View style={styles.listCard}>
          <View style={styles.listText}>
            <Text style={styles.listTitle}>{topTask ? topTask.title : 'Keep the day light and protect recovery.'}</Text>
            <Text style={styles.listMeta}>
              {topTask
                ? `${topTask.energyCost} energy • ${topTask.estimatedMinutes} min • score ${topTask.priorityScore}`
                : 'If your energy is unstable, avoid filling the space with shallow work.'}
            </Text>
          </View>
        </View>
      </Card>

      <Card title={weeklyInsight.title} subtitle={weeklyInsight.summary} tone="teal">
        <Text style={styles.lightBody}>{weeklyInsight.experiment}</Text>
      </Card>

      <Card title={dailyBrief.headline} subtitle={dailyBrief.focusBlock} tone="navy">
        <Text style={styles.inverseBody}>{dailyBrief.recoveryAnchor}</Text>
        <View style={styles.aiCoachBox}>
          <Text style={styles.aiCoachTitle}>{aiCoach.title}</Text>
          <Text style={styles.inverseBody}>{aiCoach.message}</Text>
          <Text style={styles.aiCoachAction}>Next: {aiCoach.nextAction}</Text>
          <Text style={styles.aiCoachBoundary}>Protect: {aiCoach.protectBoundary}</Text>
          <View style={styles.aiMetaBox}>
            <Text style={styles.aiMetaTitle}>
              {aiStatus === 'ready' ? 'Live AI coaching active' : aiStatus === 'loading' ? 'Refreshing live coach' : 'Fallback coaching active'}
            </Text>
            <Text style={styles.aiMetaBody}>{aiMessage}</Text>
          </View>
          <Pressable onPress={retryLiveCoaching} style={styles.aiRefreshButton}>
            <Text style={styles.aiRefreshButtonLabel}>Refresh coach</Text>
          </Pressable>
        </View>
      </Card>

      <Card title="Care anchors for today" subtitle="The basics that keep the rest of the day from becoming damage control." tone="light">
        <View style={styles.metricsGrid}>
          <MetricPill label="Meals" value={`${dashboard.carePlan.mealsDone}/${dashboard.carePlan.mealsTarget}`} />
          <MetricPill label="Water" value={`${dashboard.carePlan.hydrationDone}/${dashboard.carePlan.hydrationTarget}`} />
          <MetricPill label="Movement" value={`${dashboard.carePlan.movementDone}/${dashboard.carePlan.movementTarget}`} />
          <MetricPill label="Rest" value={`${dashboard.carePlan.restDone}/${dashboard.carePlan.restTarget}`} />
        </View>
      </Card>

      <Card title="Keep these in view" subtitle="Small non-negotiables that protect your capacity while you work." tone="lime">
        {essentials.map((item) => (
          <View key={item} style={styles.simpleRow}>
            <Text style={styles.listTitle}>{item}</Text>
          </View>
        ))}
      </Card>

      <Card title="Upcoming reminders" subtitle="The next prompts designed to interrupt autopilot before it turns into burnout." tone="navy">
        {nextReminders.slice(0, 3).map((reminder) => (
          <View key={reminder.id} style={styles.reminderPreviewRow}>
            <View>
              <Text style={styles.inverseTitle}>{reminder.title}</Text>
              <Text style={styles.inverseBody}>{reminder.note}</Text>
            </View>
            <Text style={styles.reminderTime}>{reminder.time}</Text>
          </View>
        ))}
      </Card>

      <Card title="Weekly summary" subtitle={weeklySummary.protectiveAction} tone="teal">
        <View style={styles.summaryRow}>
          <SummaryItem label="Completion" value={`${weeklySummary.completionRate}%`} />
          <SummaryItem label="Tasks done" value={`${weeklySummary.completedTasks}`} />
          <SummaryItem label="Stress avg" value={`${weeklySummary.averageStressLoad}/10`} />
        </View>
      </Card>
    </View>
  );
}
