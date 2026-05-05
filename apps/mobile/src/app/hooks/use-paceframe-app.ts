import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
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
  getFocusLabelForPlanningStyle,
  getBurnoutSignal,
  getCompletedTasks,
  type LiveAssistantReply,
  type LiveCoachingBundle,
  mergeDashboardState,
  mockDashboard,
  reopenTask,
  toggleReminder,
  updateCarePlanTarget,
  updateCarePlanMetric,
  updateEnergyState,
  updateUserProfile,
  updateReflection,
  updateReminderTime,
  type CrashWindow,
  type DashboardState,
  type EnergyLevel,
  type PlanningStyle
} from '@paceframe/shared';
import { auth, hasFirebaseConfig } from '../../lib/firebase';
import { STORAGE_KEY } from '../constants';
import type { AuthMode, PaceframeAppController } from '../types';
import { fetchLiveAssistantReply, fetchLiveCoaching } from '../services/ai-coaching';
import { ensureRemoteUser, loadRemoteDashboard, saveRemoteDashboard } from '../services/dashboard-sync';
import { clamp, formatAuthErrorMessage, formatSyncErrorMessage, getAuthModeMessage, isSyncSetupIssue, shiftTime } from '../utils';

const AI_REQUEST_DEDUPE_WINDOW_MS = 10_000;
const AI_QUOTA_BACKOFF_MS = 5 * 60_000;
let lastGlobalCoachingRequestKey = '';
let lastGlobalCoachingRequestAt = 0;
let lastGlobalQuotaBackoffUntil = 0;

export function usePaceframeApp(): PaceframeAppController {
  const [dashboard, setDashboard] = useState<DashboardState>(mockDashboard);
  const [activeTab, setActiveTab] = useState<PaceframeAppController['activeTab']>('overview');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState<PaceframeAppController['newTaskEnergy']>('medium');
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<PaceframeAppController['authStatus']>('idle');
  const [authMessage, setAuthMessage] = useState(getAuthModeMessage('signup'));
  const [syncStatus, setSyncStatus] = useState<PaceframeAppController['syncStatus']>('idle');
  const [syncMessage, setSyncMessage] = useState('Cloud sync will activate once Supabase accepts your Firebase identity.');
  const [aiStatus, setAIStatus] = useState<PaceframeAppController['aiStatus']>('idle');
  const [aiMessage, setAIMessage] = useState('Live AI coaching will appear once the AI service responds.');
  const [liveCoaching, setLiveCoaching] = useState<LiveCoachingBundle | null>(null);
  const [assistantStatus, setAssistantStatus] = useState<PaceframeAppController['assistantStatus']>('idle');
  const [assistantMessage, setAssistantMessage] = useState('Ask Paceframe AI about what to do next, whether to recover, or how to scope today down.');
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantReply, setAssistantReply] = useState<LiveAssistantReply | null>(null);
  const [assistantHistory, setAssistantHistory] = useState<PaceframeAppController['assistantHistory']>([]);
  const [user, setUser] = useState<PaceframeAppController['user']>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(!hasFirebaseConfig);
  const [isCloudHydrated, setIsCloudHydrated] = useState(false);
  const [cloudSetupRequired, setCloudSetupRequired] = useState(false);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [aiAttempt, setAIAttempt] = useState(0);
  const aiRefreshFingerprint = useMemo(
    () =>
      JSON.stringify({
        profile: dashboard.profile,
        energyState: dashboard.energyState,
        tasks: dashboard.tasks,
        carePlan: dashboard.carePlan,
        reflection: dashboard.reflection,
        weeklyBurnoutScores: dashboard.weeklyBurnoutScores,
        streakDays: dashboard.streakDays
      }),
    [
      dashboard.carePlan,
      dashboard.energyState,
      dashboard.profile,
      dashboard.reflection,
      dashboard.streakDays,
      dashboard.tasks,
      dashboard.weeklyBurnoutScores
    ]
  );

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
    if (!user) {
      setIsCloudHydrated(true);
      setCloudSetupRequired(false);
      setSyncStatus('idle');
      setSyncMessage('Sign in to connect this device with your Supabase cloud state.');
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function hydrateCloudState() {
      setIsCloudHydrated(false);
      setSyncStatus('syncing');
      setSyncMessage('Connecting to Supabase and loading your dashboard...');

      try {
        await currentUser.getIdToken(true);
        await ensureRemoteUser(currentUser);
        const remoteDashboard = await loadRemoteDashboard(currentUser);

        if (cancelled) {
          return;
        }

        if (remoteDashboard) {
          setDashboard(remoteDashboard);
          setSyncMessage('Cloud sync connected. Your latest Paceframe dashboard was loaded.');
        } else {
          setSyncMessage('Cloud sync connected. This device is ready to save your Paceframe state.');
        }

        setSyncStatus('synced');
        setCloudSetupRequired(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCloudSetupRequired(isSyncSetupIssue(error));
        setSyncStatus(isSyncSetupIssue(error) ? 'setup' : 'error');
        setSyncMessage(formatSyncErrorMessage(error));
      } finally {
        if (!cancelled) {
          setIsCloudHydrated(true);
        }
      }
    }

    void hydrateCloudState();

    return () => {
      cancelled = true;
    };
  }, [syncAttempt, user]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dashboard)).catch(() => undefined);
  }, [dashboard, isHydrated]);

  useEffect(() => {
    if (!user || !isHydrated || !isCloudHydrated || cloudSetupRequired) {
      return;
    }

    const currentUser = user;
    const timeoutId = setTimeout(() => {
      setSyncStatus('syncing');
      setSyncMessage('Saving your Paceframe changes to Supabase...');

      void saveRemoteDashboard(currentUser, dashboard)
        .then(() => {
          setSyncStatus('synced');
          setSyncMessage('Cloud sync is active. Your latest Paceframe changes are saved.');
        })
        .catch((error) => {
          setCloudSetupRequired(isSyncSetupIssue(error));
          setSyncStatus(isSyncSetupIssue(error) ? 'setup' : 'error');
          setSyncMessage(formatSyncErrorMessage(error));
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [cloudSetupRequired, dashboard, isCloudHydrated, isHydrated, user]);

  useEffect(() => {
    if (!user) {
      setLiveCoaching(null);
      setAIStatus('idle');
      setAIMessage('Sign in to activate live AI coaching.');
      setAssistantReply(null);
      setAssistantHistory([]);
      setAssistantPrompt('');
      setAssistantStatus('idle');
      setAssistantMessage('Sign in to ask Paceframe AI for live guidance.');
      return;
    }

    if (!isHydrated || !dashboard.profile.onboardingComplete) {
      return;
    }

    if (!isCloudHydrated) {
      return;
    }

    const requestKey = `${user.uid}:${aiAttempt}:${aiRefreshFingerprint}`;
    const now = Date.now();

    if (aiAttempt === 0 && now < lastGlobalQuotaBackoffUntil) {
      return;
    }

    if (
      lastGlobalCoachingRequestKey === requestKey &&
      now - lastGlobalCoachingRequestAt < AI_REQUEST_DEDUPE_WINDOW_MS
    ) {
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(() => {
      lastGlobalCoachingRequestKey = requestKey;
      lastGlobalCoachingRequestAt = Date.now();
      setAIStatus('loading');
      setAIMessage('Paceframe AI is refreshing your live coach guidance...');

      void fetchLiveCoaching(dashboard, user.email)
        .then((bundle) => {
          if (cancelled) {
            return;
          }

          lastGlobalQuotaBackoffUntil = 0;
          setLiveCoaching(bundle);
          setAIStatus('ready');
          setAIMessage(`Live coaching updated with ${bundle.model}.`);
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
            lastGlobalQuotaBackoffUntil = Date.now() + AI_QUOTA_BACKOFF_MS;
          }

          setAIStatus('error');
          setAIMessage(error instanceof Error ? error.message : 'Live AI coaching could not be refreshed.');
        });
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [aiAttempt, aiRefreshFingerprint, isCloudHydrated, isHydrated, user]);

  const plan = useMemo(() => buildTodayPlan(dashboard), [dashboard]);
  const burnoutSignal = useMemo(() => getBurnoutSignal(dashboard.energyState), [dashboard.energyState]);
  const fallbackCoach = useMemo(() => buildAICoachCard(dashboard), [dashboard]);
  const fallbackDailyBrief = useMemo(() => buildDailyBrief(dashboard), [dashboard]);
  const fallbackWeeklyInsight = useMemo(() => buildWeeklyInsight(dashboard), [dashboard]);
  const aiCoach = useMemo(() => liveCoaching?.aiCoach ?? fallbackCoach, [fallbackCoach, liveCoaching]);
  const dailyBrief = useMemo(() => liveCoaching?.dailyBrief ?? fallbackDailyBrief, [fallbackDailyBrief, liveCoaching]);
  const weeklyInsight = useMemo(() => liveCoaching?.weeklyInsight ?? fallbackWeeklyInsight, [fallbackWeeklyInsight, liveCoaching]);
  const weeklySummary = useMemo(() => buildWeeklySummary(dashboard), [dashboard]);
  const completedTasks = useMemo(() => getCompletedTasks(dashboard.tasks), [dashboard.tasks]);
  const careConsistency = useMemo(() => calculateCareConsistency(dashboard.carePlan), [dashboard.carePlan]);
  const nextReminders = useMemo(
    () => dashboard.reminders.filter((reminder) => reminder.enabled).sort((left, right) => left.time.localeCompare(right.time)),
    [dashboard.reminders]
  );

  function handleAuthModeChange(mode: AuthMode) {
    setAuthMode(mode);
    setAuthStatus('idle');
    setAuthMessage(getAuthModeMessage(mode));
  }

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
    setDashboard((current) => {
      const nextTasks = completeTask(current.tasks, taskId);
      const remainingTasks = nextTasks.filter((task) => task.status === 'pending');

      if (remainingTasks.length === 0) {
        return {
          ...current,
          tasks: nextTasks,
          taskFlow: {
            selectedEnergyLane: null,
            needsEnergyConfirmation: false
          }
        };
      }

      const burnout = getBurnoutSignal(current.energyState);

      return {
        ...current,
        tasks: nextTasks,
        taskFlow:
          burnout.level === 'high'
            ? {
                selectedEnergyLane: null,
                needsEnergyConfirmation: false
              }
            : {
                selectedEnergyLane: null,
                needsEnergyConfirmation: true
              }
      };
    });
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

  function adjustCareTarget(key: 'hydrationTarget' | 'mealsTarget' | 'movementTarget' | 'restTarget', direction: -1 | 1) {
    setDashboard((current) => ({
      ...current,
      carePlan: updateCarePlanTarget(current.carePlan, key, direction)
    }));
  }

  function toggleReminderEnabled(reminderId: string) {
    setDashboard((current) => ({
      ...current,
      reminders: toggleReminder(current.reminders, reminderId)
    }));
  }

  function shiftReminderByStep(reminderId: string, direction: -1 | 1) {
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

  function updateProfileField(field: 'firstName' | 'roleLabel' | 'primaryGoal', value: string) {
    setDashboard((current) => ({
      ...current,
      profile: updateUserProfile(current.profile, {
        [field]: value
      })
    }));
  }

  function setPlanningStyle(style: PlanningStyle) {
    setDashboard((current) => ({
      ...current,
      profile: updateUserProfile(current.profile, {
        planningStyle: style
      }),
      energyState: updateEnergyState(current.energyState, {
        focusLabel: getFocusLabelForPlanningStyle(style)
      })
    }));
  }

  function setCrashWindow(window: CrashWindow) {
    setDashboard((current) => ({
      ...current,
      profile: updateUserProfile(current.profile, {
        crashWindow: window
      })
    }));
  }

  function completeOnboarding() {
    setDashboard((current) => ({
      ...current,
      profile: updateUserProfile(current.profile, {
        onboardingComplete: true
      })
    }));
    setActiveTab('overview');
  }

  function retryCloudSync() {
    setCloudSetupRequired(false);
    setSyncStatus('syncing');
    setSyncMessage('Retrying Supabase sync...');
    setSyncAttempt((current) => current + 1);
  }

  function retryLiveCoaching() {
    setAIStatus('loading');
    setAIMessage('Retrying live AI coaching...');
    setAIAttempt((current) => current + 1);
  }

  function selectEnergyLane(level: EnergyLevel) {
    setDashboard((current) => ({
      ...current,
      energyState: updateEnergyState(current.energyState, {
        energy: level
      }),
      taskFlow: {
        selectedEnergyLane: level,
        needsEnergyConfirmation: false
      }
    }));
  }

  async function submitAssistantQuestion(promptOverride?: string) {
    const question = (promptOverride ?? assistantPrompt).trim();

    if (!user) {
      setAssistantStatus('error');
      setAssistantMessage('Sign in before using Paceframe AI.');
      return;
    }

    if (!question) {
      setAssistantStatus('error');
      setAssistantMessage('Ask Paceframe AI a specific question first.');
      return;
    }

    try {
      const nextUserMessage = {
        id: `${Date.now()}-user`,
        role: 'user' as const,
        text: question,
        meta: undefined
      };
      const outboundHistory = [...assistantHistory, nextUserMessage]
        .slice(-8)
        .map(({ role, text, meta }) => ({ role, text, meta }));

      setAssistantStatus('loading');
      setAssistantMessage('Paceframe AI is reading your current state and shaping an answer...');
      setAssistantReply(null);
      setAssistantHistory((current) => [...current, nextUserMessage]);
      setAssistantPrompt('');

      const reply = await fetchLiveAssistantReply(dashboard, question, user.email, outboundHistory);

      setAssistantReply(reply);
      setAssistantHistory((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: `${reply.headline}\n\n${reply.answer}`,
          meta: [
            reply.planSteps.length > 0 ? reply.planSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') : '',
            `Next: ${reply.suggestedAction}`,
            reply.supportiveNote ? `Support: ${reply.supportiveNote}` : '',
            reply.followUpQuestion ? `Follow-up: ${reply.followUpQuestion}` : ''
          ]
            .filter(Boolean)
            .join('\n\n')
        }
      ]);
      setAssistantStatus('ready');
      setAssistantMessage(`Answered live with ${reply.model}.`);
    } catch (error) {
      setAssistantStatus('error');
      setAssistantMessage(error instanceof Error ? error.message : 'Paceframe AI could not answer right now.');
    }
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
        const credential = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        await credential.user.getIdToken(true);
        setDashboard(
          mergeDashboardState({
            profile: {
              ...mockDashboard.profile,
              firstName: '',
              roleLabel: '',
              primaryGoal: '',
              onboardingComplete: false
            },
            tasks: [],
            reflection: {
              intention: '',
              eveningNote: '',
              gratitude: ''
            },
            carePlan: {
              ...mockDashboard.carePlan,
              hydrationDone: 0,
              mealsDone: 0,
              movementDone: 0,
              restDone: 0
            },
            streakDays: 0,
            weeklyBurnoutScores: []
          })
        );
        setActiveTab('account');
        setAuthStatus('idle');
        setAuthMessage('Account created. Let’s personalize Paceframe for your rhythm.');
        return;
      }

      if (authMode === 'signin') {
        const credential = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        await credential.user.getIdToken(true);
        setAuthStatus('idle');
        setAuthMessage('Signed in successfully.');
        return;
      }

      await sendPasswordResetEmail(auth, authEmail.trim());
      setAuthStatus('sent');
      setAuthMessage('Password reset email sent. Check your inbox to continue.');
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(formatAuthErrorMessage(error, authMode));
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

  return {
    dashboard,
    activeTab,
    setActiveTab,
    newTaskTitle,
    setNewTaskTitle,
    newTaskEnergy,
    setNewTaskEnergy,
    authMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authStatus,
    authMessage,
    authReady: Boolean(hasFirebaseConfig && auth),
    syncStatus,
    syncMessage,
    aiStatus,
    aiMessage,
    liveCoaching,
    assistantStatus,
    assistantMessage,
    assistantPrompt,
    setAssistantPrompt,
    assistantReply,
    assistantHistory,
    user,
    isReady: isHydrated && isAuthResolved,
    plan,
    burnoutSignal,
    aiCoach,
    dailyBrief,
    weeklyInsight,
    weeklySummary,
    completedTasks,
    careConsistency,
    nextReminders,
    handleAuthModeChange,
    handleAuthSubmit,
    handleSignOut,
    adjustEnergy,
    adjustSleepTrouble,
    handleAddTask,
    markTaskDone,
    reopenCompletedTask,
    adjustCareMetric,
    adjustCareTarget,
    toggleReminderEnabled,
    shiftReminder: shiftReminderByStep,
    updateReflectionField,
    updateProfileField,
    setPlanningStyle,
    setCrashWindow,
    completeOnboarding,
    retryCloudSync,
    retryLiveCoaching,
    selectEnergyLane,
    submitAssistantQuestion
  };
}
