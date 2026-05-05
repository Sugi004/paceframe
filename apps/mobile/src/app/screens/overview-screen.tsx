import { Pressable, ScrollView, Text, View } from 'react-native';
import type { PaceframeAppController } from '../types';
import { Card, MetricPill, SummaryItem } from '../components/primitives';
import { HeroCard } from '../components/hero-card';
import { styles } from '../styles';

type OverviewScreenProps = Pick<
  PaceframeAppController,
  | 'dashboard'
  | 'careConsistency'
  | 'weeklyInsight'
  | 'dailyBrief'
  | 'aiCoach'
  | 'nextReminders'
  | 'weeklySummary'
  | 'burnoutSignal'
  | 'plan'
  | 'aiStatus'
  | 'aiMessage'
  | 'retryLiveCoaching'
  | 'liveCoaching'
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
  retryLiveCoaching,
  liveCoaching
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

      <Card title="AI control deck" subtitle="Swipe through the live coaching layer, your best move, and the weekly experiment without leaving the overview." tone="light">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselTrack}>
          <View style={[styles.carouselPanel, styles.carouselPanelNavy]}>
            <Text style={styles.carouselEyebrow}>Live coach</Text>
            <Text style={styles.carouselTitleLight}>{aiStatus === 'ready' ? 'Personalized guidance is active' : aiStatus === 'loading' ? 'Refreshing your guidance' : 'Fallback coach is protecting the day'}</Text>
            <Text style={styles.carouselBodyLight}>{liveCoaching?.reasoningSummary ?? aiMessage}</Text>
            <Text style={styles.carouselMetaLight}>{liveCoaching ? `Updated ${new Date(liveCoaching.generatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Using on-device planning logic right now'}</Text>
          </View>

          <View style={[styles.carouselPanel, styles.carouselPanelWarm]}>
            <Text style={styles.carouselEyebrowDark}>Best move</Text>
            <Text style={styles.carouselTitleDark}>{topTask ? topTask.title : 'Keep the day lighter than your instincts want.'}</Text>
            <Text style={styles.carouselBodyDark}>
              {topTask
                ? `${topTask.energyCost} energy • ${topTask.estimatedMinutes} min • priority ${topTask.priorityScore}`
                : 'When your state is unstable, protecting recovery is more valuable than filling every open slot.'}
            </Text>
            <Text style={styles.carouselMetaDark}>{topTask ? 'Recommended anchor task' : 'Paceframe is asking for restraint today'}</Text>
          </View>

          <View style={[styles.carouselPanel, styles.carouselPanelTeal]}>
            <Text style={styles.carouselEyebrowDark}>Weekly experiment</Text>
            <Text style={styles.carouselTitleDark}>{weeklyInsight.title}</Text>
            <Text style={styles.carouselBodyDark}>{weeklyInsight.experiment}</Text>
            <Text style={styles.carouselMetaDark}>{weeklyInsight.summary}</Text>
          </View>
        </ScrollView>
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
        <View style={styles.essentialsWrap}>
          {essentials.map((item) => (
            <View key={item} style={styles.essentialChip}>
              <Text style={styles.essentialChipLabel}>{item}</Text>
            </View>
          ))}
        </View>
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
