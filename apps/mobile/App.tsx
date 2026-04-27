import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import {
  buildAICoachCard,
  buildDailyBrief,
  buildTodayPlan,
  buildWeeklyInsight,
  buildWeeklySummary,
  calculateCareConsistency,
  completeTask,
  createTask,
  getBurnoutSignal,
  getCompletedTasks,
  mergeDashboardState,
  mockDashboard,
  recoveryProtocols,
  reopenTask,
  toggleReminder,
  updateCarePlanMetric,
  updateEnergyState,
  updateReflection,
  updateReminderTime,
  type DashboardState,
  type EnergyLevel
} from '@paceframe/shared';
import { PaceframeLogo } from './src/components/paceframe-logo';
import { auth, hasFirebaseConfig } from './src/lib/firebase';

type Tab = 'overview' | 'plan' | 'checkin' | 'reset';
type AuthMode = 'signup' | 'signin' | 'reset';

const STORAGE_KEY = 'paceframe-dashboard-v1';

const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'reset', label: 'Reset' }
];

const energyLevels: EnergyLevel[] = ['low', 'medium', 'high'];

export default function App() {
  const [dashboard, setDashboard] = useState<DashboardState>(mockDashboard);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState<EnergyLevel>('medium');
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');
  const [authMessage, setAuthMessage] = useState('Create your Paceframe account to keep planning, reminders, and recovery tied to one identity.');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(!hasFirebaseConfig);

  useEffect(() => {
    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setDashboard(mergeDashboardState(JSON.parse(stored) as Partial<DashboardState>));
        }
      } catch {
        setDashboard(mockDashboard);
      } finally {
        setIsHydrated(true);
      }
    }

    hydrate();
  }, []);

  useEffect(() => {
    if (!auth) {
      setIsAuthResolved(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setIsAuthResolved(true);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard)).catch(() => undefined);
  }, [dashboard, isHydrated]);

  const plan = useMemo(() => buildTodayPlan(dashboard), [dashboard]);
  const burnoutSignal = useMemo(() => getBurnoutSignal(dashboard.energyState), [dashboard.energyState]);
  const aiCoach = useMemo(() => buildAICoachCard(dashboard), [dashboard]);
  const dailyBrief = useMemo(() => buildDailyBrief(dashboard), [dashboard]);
  const weeklyInsight = useMemo(() => buildWeeklyInsight(dashboard), [dashboard]);
  const weeklySummary = useMemo(() => buildWeeklySummary(dashboard), [dashboard]);
  const completedTasks = useMemo(() => getCompletedTasks(dashboard.tasks), [dashboard.tasks]);
  const careConsistency = useMemo(() => calculateCareConsistency(dashboard.carePlan), [dashboard.carePlan]);
  const nextReminders = useMemo(
    () => dashboard.reminders.filter((reminder) => reminder.enabled).sort((left, right) => left.time.localeCompare(right.time)),
    [dashboard.reminders]
  );

  function adjustEnergy(metric: 'stressLevel' | 'screenFatigue', direction: -1 | 1) {
    setDashboard((current) => ({
      ...current,
      energyState: updateEnergyState(current.energyState, {
        [metric]: clamp(current.energyState[metric] + direction, 1, 10)
      }),
      checkIn: {
        ...current.checkIn,
        [metric]: clamp(current.checkIn[metric] + direction, 1, 10)
      }
    }));
  }

  function adjustSleepTrouble(direction: -1 | 1) {
    setDashboard((current) => {
      const currentTrouble = 11 - current.energyState.sleepQuality;
      const nextTrouble = clamp(currentTrouble + direction, 1, 10);
      const nextQuality = 11 - nextTrouble;

      return {
        ...current,
        energyState: updateEnergyState(current.energyState, {
          sleepQuality: nextQuality
        }),
        checkIn: {
          ...current.checkIn,
          sleepQuality: nextQuality
        }
      };
    });
  }

  function handleAddTask() {
    if (!newTaskTitle.trim()) {
      return;
    }

    setDashboard((current) => ({
      ...current,
      tasks: [
        createTask({
          title: newTaskTitle,
          urgency: 7,
          importance: 7,
          energyCost: newTaskEnergy,
          estimatedMinutes: 45
        }),
        ...current.tasks
      ]
    }));
    setNewTaskTitle('');
    setNewTaskEnergy('medium');
  }

  function markTaskDone(taskId: string) {
    setDashboard((current) => ({
      ...current,
      tasks: completeTask(current.tasks, taskId)
    }));
  }

  function reopenCompletedTask(taskId: string) {
    setDashboard((current) => ({
      ...current,
      tasks: reopenTask(current.tasks, taskId)
    }));
  }

  function adjustCareMetric(key: 'hydrationDone' | 'mealsDone' | 'movementDone' | 'restDone', direction: -1 | 1) {
    setDashboard((current) => ({
      ...current,
      carePlan: updateCarePlanMetric(current.carePlan, key, direction)
    }));
  }

  function toggleReminderEnabled(reminderId: string) {
    setDashboard((current) => ({
      ...current,
      reminders: toggleReminder(current.reminders, reminderId)
    }));
  }

  function shiftReminder(reminderId: string, direction: -1 | 1) {
    const reminder = dashboard.reminders.find((item) => item.id === reminderId);
    if (!reminder) {
      return;
    }

    const nextTime = shiftTime(reminder.time, direction);
    setDashboard((current) => ({
      ...current,
      reminders: updateReminderTime(current.reminders, reminderId, nextTime)
    }));
  }

  function updateReflectionField(field: 'intention' | 'eveningNote' | 'gratitude', value: string) {
    setDashboard((current) => ({
      ...current,
      reflection: updateReflection(current.reflection, {
        [field]: value
      })
    }));
  }

  async function handleAuthSubmit() {
    if (!auth) {
      setAuthStatus('error');
      setAuthMessage('Firebase is not configured for mobile yet.');
      return;
    }

    if (!authEmail.trim()) {
      setAuthStatus('error');
      setAuthMessage('Enter your email address first.');
      return;
    }

    if (authMode !== 'reset' && authPassword.length < 6) {
      setAuthStatus('error');
      setAuthMessage('Use a password with at least 6 characters.');
      return;
    }

    try {
      setAuthStatus('working');

      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setAuthStatus('idle');
        setAuthMessage('Account created. Your Paceframe home is ready.');
        return;
      }

      if (authMode === 'signin') {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setAuthStatus('idle');
        setAuthMessage('Signed in successfully.');
        return;
      }

      await sendPasswordResetEmail(auth, authEmail.trim());
      setAuthStatus('sent');
      setAuthMessage('Password reset email sent. Check your inbox to continue.');
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(error instanceof Error ? error.message : 'We could not complete that request.');
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    await signOut(auth);
    setAuthStatus('idle');
    setAuthMessage('Signed out. Sign back in whenever you are ready.');
  }

  if (!isHydrated || !isAuthResolved) {
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

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <ScrollView style={styles.screen} contentContainerStyle={styles.authContent} showsVerticalScrollIndicator={false}>
          <AuthFrontPage
            authMode={authMode}
            email={authEmail}
            password={authPassword}
            message={authMessage}
            status={authStatus}
            authReady={Boolean(hasFirebaseConfig && auth)}
            onModeChange={(mode) => {
              setAuthMode(mode);
              setAuthStatus('idle');
              setAuthMessage(
                mode === 'signup'
                  ? 'Create your Paceframe account to keep planning, reminders, and recovery tied to one identity.'
                  : mode === 'signin'
                    ? 'Sign in to continue where your pacing, recovery, and routines left off.'
                    : 'Enter your email and we will send a password reset message.'
              );
            }}
            onEmailChange={setAuthEmail}
            onPasswordChange={setAuthPassword}
            onSubmit={handleAuthSubmit}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.accountBar}>
          <View style={styles.accountIdentity}>
            <PaceframeLogo size={34} />
            <View>
              <Text style={styles.accountLabel}>Paceframe account</Text>
              <Text style={styles.accountEmail}>{user.email ?? 'Signed in'}</Text>
            </View>
          </View>
          <Pressable onPress={handleSignOut} style={styles.accountButton}>
            <Text style={styles.accountButtonLabel}>Sign out</Text>
          </Pressable>
        </View>

        <HeroCard
          focusLabel={dashboard.energyState.focusLabel}
          burnoutLevel={burnoutSignal.level}
          burnoutScore={burnoutSignal.score}
          burnoutSummary={burnoutSignal.summary}
          careConsistency={careConsistency}
        />

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tab, activeTab === tab.key ? styles.tabActive : undefined]}
            >
              <Text style={[styles.tabLabel, activeTab === tab.key ? styles.tabLabelActive : undefined]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {activeTab === 'overview' ? (
          <View>
            <Card title="Today at a glance" subtitle="Read your current state, then shape the day around your actual capacity." tone="light">
              <View style={styles.metricsGrid}>
                <MetricPill label="Energy" value={dashboard.energyState.energy} />
                <MetricPill label="Sleep" value={`${dashboard.energyState.sleepQuality}/10`} />
                <MetricPill label="Stress" value={`${dashboard.energyState.stressLevel}/10`} />
                <MetricPill label="Care score" value={`${careConsistency}%`} />
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
              </View>
            </Card>

            <Card title="Care progress" subtitle="Meals, water, movement, and rest in one place so recovery stays visible." tone="warm">
              <View style={styles.metricsGrid}>
                <MetricPill label="Meals" value={`${dashboard.carePlan.mealsDone}/${dashboard.carePlan.mealsTarget}`} />
                <MetricPill label="Water" value={`${dashboard.carePlan.hydrationDone}/${dashboard.carePlan.hydrationTarget}`} />
                <MetricPill label="Movement" value={`${dashboard.carePlan.movementDone}/${dashboard.carePlan.movementTarget}`} />
                <MetricPill label="Rest" value={`${dashboard.carePlan.restDone}/${dashboard.carePlan.restTarget}`} />
              </View>
            </Card>

            <Card title="Upcoming reminders" subtitle="The prompts keeping your day from running purely on momentum." tone="navy">
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

            <Card title="Weekly summary" subtitle={weeklySummary.protectiveAction} tone="lime">
              <View style={styles.summaryRow}>
                <SummaryItem label="Completion" value={`${weeklySummary.completionRate}%`} />
                <SummaryItem label="Tasks done" value={`${weeklySummary.completedTasks}`} />
                <SummaryItem label="Stress avg" value={`${weeklySummary.averageStressLoad}/10`} />
              </View>
            </Card>
          </View>
        ) : null}

        {activeTab === 'plan' ? (
          <View>
            <Card title="Priority stack" subtitle="Tasks are ordered using urgency, importance, energy fit, and recovery cost." tone="light">
              {plan.prioritizedTasks.map((task) => (
                <View key={task.id} style={styles.listCard}>
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{task.title}</Text>
                    <Text style={styles.listMeta}>
                      {task.energyCost} energy • {task.estimatedMinutes} min • score {task.priorityScore}
                    </Text>
                  </View>
                  <Pressable onPress={() => markTaskDone(task.id)} style={[styles.badge, styles.badgeOpen]}>
                    <Text style={styles.badgeLabel}>Done</Text>
                  </Pressable>
                </View>
              ))}
            </Card>

            <Card title="Quick capture" subtitle="Add work fast and let the app shape the day around your capacity." tone="warm">
              <TextInput
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                placeholder="Add a task that matters"
                placeholderTextColor="#7b8398"
                style={styles.input}
              />
              <View style={styles.segmentRow}>
                {energyLevels.map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setNewTaskEnergy(level)}
                    style={[styles.segment, newTaskEnergy === level ? styles.segmentActive : undefined]}
                  >
                    <Text style={[styles.segmentLabel, newTaskEnergy === level ? styles.segmentLabelActive : undefined]}>{level}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable onPress={handleAddTask} style={styles.primaryButton}>
                <Text style={styles.primaryButtonLabel}>Add task to plan</Text>
              </Pressable>
            </Card>

            <Card title="Adaptive routines" subtitle="Habits that support you before burnout becomes the default operating mode." tone="lime">
              {dashboard.routines.map((routine) => (
                <View key={routine.id} style={styles.simpleRow}>
                  <Text style={styles.listTitle}>{routine.title}</Text>
                  <Text style={styles.listMeta}>
                    {routine.cue} • {routine.energyMatch}
                  </Text>
                </View>
              ))}
            </Card>

            {completedTasks.length > 0 ? (
              <Card title="Completed tasks" subtitle="Finished work stays here and can be reopened intentionally if needed." tone="teal">
                {completedTasks.map((task) => (
                  <View key={task.id} style={styles.completedRow}>
                    <View style={styles.listText}>
                      <Text style={styles.completedTitle}>{task.title}</Text>
                      <Text style={styles.listMeta}>
                        {task.energyCost} energy • {task.estimatedMinutes} min
                      </Text>
                    </View>
                    <Pressable onPress={() => reopenCompletedTask(task.id)} style={[styles.badge, styles.badgeDone]}>
                      <Text style={styles.badgeLabel}>Reopen</Text>
                    </Pressable>
                  </View>
                ))}
              </Card>
            ) : null}
          </View>
        ) : null}

        {activeTab === 'checkin' ? (
          <View>
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
              <Text style={styles.fieldLabel}>Today&apos;s intention</Text>
              <TextInput
                value={dashboard.reflection.intention}
                onChangeText={(value) => updateReflectionField('intention', value)}
                placeholder="What matters most today?"
                placeholderTextColor="#7b8398"
                style={styles.textArea}
                multiline
              />
              <Text style={styles.fieldLabel}>Evening note</Text>
              <TextInput
                value={dashboard.reflection.eveningNote}
                onChangeText={(value) => updateReflectionField('eveningNote', value)}
                placeholder="What drained you or helped you today?"
                placeholderTextColor="#7b8398"
                style={styles.textArea}
                multiline
              />
              <Text style={styles.fieldLabel}>Gratitude</Text>
              <TextInput
                value={dashboard.reflection.gratitude}
                onChangeText={(value) => updateReflectionField('gratitude', value)}
                placeholder="What felt grounding or good?"
                placeholderTextColor="#7b8398"
                style={styles.textArea}
                multiline
              />
            </Card>
          </View>
        ) : null}

        {activeTab === 'reset' ? (
          <View>
            <Card title={`Burnout risk: ${burnoutSignal.level} • ${burnoutSignal.score}/100`} subtitle={burnoutSignal.summary} tone="navy">
              {recoveryProtocols[burnoutSignal.level].map((protocol) => (
                <View key={protocol.id} style={styles.protocolRow}>
                  <View style={styles.protocolDuration}>
                    <Text style={styles.protocolDurationLabel}>{protocol.duration}</Text>
                  </View>
                  <View style={styles.listText}>
                    <Text style={styles.protocolTitle}>{protocol.title}</Text>
                    <Text style={styles.protocolDescription}>{protocol.description}</Text>
                  </View>
                </View>
              ))}
            </Card>

            <Card title="Recovery blocks already in your day" subtitle="Support is already being placed before overload spills into the rest of the day." tone="warm">
              {plan.recoveryBlocks.map((item) => (
                <View key={item.label} style={styles.simpleRow}>
                  <Text style={styles.listTitle}>{item.label}</Text>
                  <Text style={styles.listMeta}>{item.window}</Text>
                </View>
              ))}
            </Card>

            <Card title="Reset sequence" subtitle="A simple order of operations when you are too overloaded to think clearly." tone="light">
              <View style={styles.simpleRow}>
                <Text style={styles.listTitle}>1. Reduce visual and notification noise</Text>
              </View>
              <View style={styles.simpleRow}>
                <Text style={styles.listTitle}>2. Eat or hydrate before chasing more output</Text>
              </View>
              <View style={styles.simpleRow}>
                <Text style={styles.listTitle}>3. Pick one essential task or end the workday early</Text>
              </View>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroCard({
  focusLabel,
  burnoutLevel,
  burnoutScore,
  burnoutSummary,
  careConsistency
}: {
  focusLabel: string;
  burnoutLevel: 'low' | 'moderate' | 'high';
  burnoutScore: number;
  burnoutSummary: string;
  careConsistency: number;
}) {
  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroEyebrow}>PACEFRAME</Text>
      <Text style={styles.heroTitle}>Plan your day around your energy, not just pressure.</Text>
      <Text style={styles.heroSubtitle}>
        One place for planning, recovery, routines, and calmer execution when your brain is carrying too much.
      </Text>

      <View style={styles.heroChips}>
        <View style={[styles.heroChip, styles.heroChipWarm]}>
          <Text style={styles.heroChipLabel}>{focusLabel}</Text>
        </View>
        <View
          style={[
            styles.heroChip,
            burnoutLevel === 'high' ? styles.heroChipDanger : burnoutLevel === 'moderate' ? styles.heroChipWarning : styles.heroChipCool
          ]}
        >
          <Text style={styles.heroChipLabel}>{burnoutLevel} burnout risk • {burnoutScore}/100</Text>
        </View>
      </View>

      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{careConsistency}%</Text>
          <Text style={styles.heroStatLabel}>care consistency</Text>
        </View>
        <View style={styles.heroStatCard}>
          <Text style={styles.heroStatValue}>{burnoutScore}</Text>
          <Text style={styles.heroStatLabel}>burnout score</Text>
        </View>
      </View>

      <View style={styles.heroSignalCard}>
        <Text style={styles.heroSignalTitle}>Recovery focus</Text>
        <Text style={styles.heroSignalBody}>{burnoutSummary}</Text>
      </View>
    </View>
  );
}

function AuthFrontPage({
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
  status: 'idle' | 'working' | 'sent' | 'error';
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

function Card({
  title,
  subtitle,
  tone,
  children
}: {
  title: string;
  subtitle: string;
  tone: 'light' | 'navy' | 'warm' | 'teal' | 'lime';
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.card,
        tone === 'navy' ? styles.cardNavy : undefined,
        tone === 'warm' ? styles.cardWarm : undefined,
        tone === 'teal' ? styles.cardTeal : undefined,
        tone === 'lime' ? styles.cardLime : undefined
      ]}
    >
      <Text style={[styles.cardTitle, tone === 'navy' ? styles.cardTitleLight : undefined]}>{title}</Text>
      <Text style={[styles.cardSubtitle, tone === 'navy' ? styles.cardSubtitleLight : undefined]}>{subtitle}</Text>
      <View>{children}</View>
    </View>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricPill}>
      <Text style={styles.metricPillLabel}>{label}</Text>
      <Text style={styles.metricPillValue}>{value}</Text>
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MetricControl({
  label,
  value,
  onMinus,
  onPlus
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.metricControl}>
      <Text style={styles.listTitle}>{label}</Text>
      <View style={styles.metricControlRight}>
        <Pressable onPress={onMinus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>-</Text>
        </Pressable>
        <Text style={styles.metricValue}>{value}/10</Text>
        <Pressable onPress={onPlus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CareTracker({
  label,
  value,
  onMinus,
  onPlus
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.metricControl}>
      <Text style={styles.listTitle}>{label}</Text>
      <View style={styles.metricControlRight}>
        <Pressable onPress={onMinus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>-</Text>
        </Pressable>
        <Text style={styles.metricValueWide}>{value}</Text>
        <Pressable onPress={onPlus} style={styles.metricButton}>
          <Text style={styles.metricButtonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function shiftTime(time: string, direction: -1 | 1) {
  const [hours, minutes] = time.split(':').map(Number);
  const total = ((hours * 60 + minutes + direction * 30) % (24 * 60) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const nextMinutes = (total % 60).toString().padStart(2, '0');
  return `${nextHours}:${nextMinutes}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#091221'
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#091221'
  },
  loadingEyebrow: {
    color: '#ff8a57',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 10
  },
  loadingTitle: {
    color: '#f7fbff',
    fontSize: 24,
    fontWeight: '900'
  },
  screen: {
    flex: 1,
    backgroundColor: '#091221'
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 40
  },
  authContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 40
  },
  authHeroCard: {
    backgroundColor: '#fef0d9',
    borderRadius: 30,
    padding: 22,
    marginBottom: 16
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  authBrandCopy: {
    marginLeft: 14,
    flex: 1
  },
  authEyebrow: {
    color: '#ff6b3d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6
  },
  authBrandTitle: {
    color: '#51617d',
    fontSize: 15,
    lineHeight: 22
  },
  authTitle: {
    color: '#0f1730',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '900',
    marginBottom: 10
  },
  authSubtitle: {
    color: '#53627e',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16
  },
  authChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  authFeatureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  authFeatureCard: {
    width: '48%',
    borderRadius: 18,
    backgroundColor: '#fff7ea',
    padding: 14
  },
  authFeatureLabel: {
    color: '#7a87a0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6
  },
  authFeatureValue: {
    color: '#0f1730',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20
  },
  authPanelCard: {
    backgroundColor: '#eef5ff',
    borderRadius: 26,
    padding: 18,
    marginBottom: 16
  },
  authPanelEyebrow: {
    color: '#4a6287',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  authModeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  authModeChip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: '#dbe8fa',
    marginRight: 10,
    marginBottom: 10
  },
  authModeChipActive: {
    backgroundColor: '#0f1730'
  },
  authModeChipLabel: {
    color: '#415777',
    fontWeight: '800'
  },
  authModeChipLabelActive: {
    color: '#ffffff'
  },
  authInput: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    marginBottom: 12
  },
  authMessageCard: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#dfeaf9',
    padding: 14
  },
  authMessageText: {
    color: '#50607c',
    lineHeight: 21
  },
  authSupportCard: {
    borderRadius: 24,
    backgroundColor: '#13294e',
    padding: 18
  },
  authSupportTitle: {
    color: '#9bdcff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  authSupportBody: {
    color: '#eef6ff',
    fontSize: 15,
    lineHeight: 23
  },
  accountBar: {
    marginBottom: 14,
    borderRadius: 22,
    backgroundColor: '#102347',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  accountIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  accountLabel: {
    color: '#8ed9ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginLeft: 10,
    marginBottom: 2
  },
  accountEmail: {
    color: '#f5fbff',
    fontWeight: '700',
    marginLeft: 10,
    maxWidth: 180
  },
  accountButton: {
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 10
  },
  accountButtonLabel: {
    color: '#0f1730',
    fontWeight: '900'
  },
  disabledButton: {
    opacity: 0.45
  },
  heroCard: {
    backgroundColor: '#fef0d9',
    borderRadius: 28,
    padding: 22,
    marginBottom: 18
  },
  heroEyebrow: {
    color: '#ff6b3d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8
  },
  heroTitle: {
    color: '#0f1730',
    fontSize: 32,
    lineHeight: 37,
    fontWeight: '900',
    marginBottom: 10
  },
  heroSubtitle: {
    color: '#4f5d79',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 14
  },
  heroChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 10,
    marginBottom: 10
  },
  heroChipWarm: {
    backgroundColor: '#ffd7c9'
  },
  heroChipCool: {
    backgroundColor: '#d1f6ff'
  },
  heroChipWarning: {
    backgroundColor: '#ffe0a8'
  },
  heroChipDanger: {
    backgroundColor: '#ffd0d0'
  },
  heroChipLabel: {
    color: '#0f1730',
    fontWeight: '700'
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  heroStatCard: {
    width: '48%',
    backgroundColor: '#fff7ea',
    borderRadius: 18,
    padding: 14
  },
  heroStatValue: {
    color: '#0f1730',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4
  },
  heroStatLabel: {
    color: '#65748f',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  heroSignalCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#102347'
  },
  heroSignalTitle: {
    color: '#8ed9ff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  heroSignalBody: {
    color: '#f5fbff',
    lineHeight: 22
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#101c32',
    borderRadius: 999,
    padding: 6,
    marginBottom: 18
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 999,
    paddingVertical: 12
  },
  tabActive: {
    backgroundColor: '#f7fbff'
  },
  tabLabel: {
    color: '#9fafc9',
    fontWeight: '700',
    fontSize: 12
  },
  tabLabelActive: {
    color: '#0f1730'
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: '#f7fbff',
    marginBottom: 16
  },
  cardNavy: {
    backgroundColor: '#102347'
  },
  cardWarm: {
    backgroundColor: '#ffe3c0'
  },
  cardTeal: {
    backgroundColor: '#cdf7ee'
  },
  cardLime: {
    backgroundColor: '#e6f9c8'
  },
  cardTitle: {
    color: '#0f1730',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6
  },
  cardTitleLight: {
    color: '#ffffff'
  },
  cardSubtitle: {
    color: '#5d6a86',
    lineHeight: 21,
    marginBottom: 14
  },
  cardSubtitleLight: {
    color: '#cfe4ff'
  },
  lightBody: {
    color: '#153141',
    lineHeight: 22
  },
  inverseTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4
  },
  inverseBody: {
    color: '#cfe1ff',
    lineHeight: 20,
    maxWidth: 220
  },
  aiCoachBox: {
    marginTop: 14,
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14
  },
  aiCoachTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 8
  },
  aiCoachAction: {
    color: '#ffd36e',
    fontWeight: '800',
    marginTop: 10,
    lineHeight: 20
  },
  aiCoachBoundary: {
    color: '#9ddcff',
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 20
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  metricPill: {
    width: '48%',
    backgroundColor: '#eaf2ff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12
  },
  metricPillLabel: {
    color: '#71819e',
    fontSize: 12,
    marginBottom: 6
  },
  metricPillValue: {
    color: '#0f1730',
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'capitalize'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryItem: {
    width: '31%',
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 12
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 6
  },
  summaryLabel: {
    color: '#bcd3f7',
    fontSize: 12
  },
  listCard: {
    backgroundColor: '#eaf2ff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  listText: {
    flex: 1,
    paddingRight: 12
  },
  listTitle: {
    color: '#0f1730',
    fontWeight: '800',
    marginBottom: 4
  },
  listMeta: {
    color: '#61708d',
    lineHeight: 20,
    textTransform: 'capitalize'
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  badgeOpen: {
    backgroundColor: '#d7e6ff'
  },
  badgeDone: {
    backgroundColor: '#c8f5de'
  },
  badgeMuted: {
    backgroundColor: '#f3d9b7'
  },
  badgeLabel: {
    color: '#0f1730',
    fontWeight: '800'
  },
  input: {
    borderRadius: 16,
    backgroundColor: '#fff5e7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    marginBottom: 12
  },
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  segment: {
    width: '31%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e6a97f',
    paddingVertical: 10,
    alignItems: 'center'
  },
  segmentActive: {
    backgroundColor: '#0f1730',
    borderColor: '#0f1730'
  },
  segmentLabel: {
    color: '#9b5d35',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  segmentLabelActive: {
    color: '#ffffff'
  },
  primaryButton: {
    backgroundColor: '#0f1730',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontWeight: '900'
  },
  simpleRow: {
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  completedRow: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  completedTitle: {
    color: '#50607c',
    fontWeight: '800',
    marginBottom: 4,
    textDecorationLine: 'line-through'
  },
  metricControl: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  metricControlRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metricButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: '#0f1730',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricButtonLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900'
  },
  metricValue: {
    color: '#0f1730',
    fontWeight: '900',
    minWidth: 50,
    textAlign: 'center'
  },
  metricValueWide: {
    color: '#0f1730',
    fontWeight: '900',
    minWidth: 62,
    textAlign: 'center'
  },
  noteBox: {
    backgroundColor: '#eaf2ff',
    borderRadius: 16,
    padding: 14,
    marginTop: 4
  },
  noteLabel: {
    color: '#73819b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  noteText: {
    color: '#53627e',
    lineHeight: 21
  },
  fieldLabel: {
    color: '#50607c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4
  },
  textArea: {
    backgroundColor: '#eaf2ff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#0f1730',
    minHeight: 92,
    textAlignVertical: 'top',
    marginBottom: 12
  },
  protocolRow: {
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 10
  },
  protocolDuration: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ffd36e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12
  },
  protocolDurationLabel: {
    color: '#0f1730',
    fontWeight: '900'
  },
  protocolTitle: {
    color: '#ffffff',
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 24
  },
  protocolDescription: {
    color: '#cfe1ff',
    lineHeight: 22
  },
  reminderPreviewRow: {
    backgroundColor: '#163056',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reminderTime: {
    color: '#ffd36e',
    fontWeight: '900'
  },
  reminderControlCard: {
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  timeAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  timeAdjustButton: {
    borderRadius: 999,
    backgroundColor: '#0f1730',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  timeAdjustLabel: {
    color: '#ffffff',
    fontWeight: '800'
  },
  reminderTimeDark: {
    color: '#0f1730',
    fontWeight: '900',
    fontSize: 16
  }
});
