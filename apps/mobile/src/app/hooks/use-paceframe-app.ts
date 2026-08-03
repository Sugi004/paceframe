import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
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
  type PlanningStyle,
  type WorkOrderingPreference
} from '@paceframe/shared';
import { auth, hasFirebaseConfig } from '../../lib/firebase';
import { getDashboardStorageKey, STORAGE_KEY } from '../constants';
import type { AuthMode, PaceframeAppController } from '../types';
import {
  fetchLatestAssistantThread,
  fetchLiveAssistantReply,
  fetchLiveCoaching,
  persistAssistantConversation,
  persistReviewArtifacts
} from '../services/ai-coaching';
import { deleteRemoteUserData, ensureRemoteUser, loadRemoteDashboard, saveRemoteDashboard } from '../services/dashboard-sync';
import {
  cancelAllReminderNotificationsAsync,
  configureNotificationHandler,
  syncReminderNotificationsAsync
} from '../services/notifications';
import {
  requestPasswordResetEmail,
  requestVerificationEmail,
  requestVerificationEmailByEmail
} from '../services/email-links';
import {
  clamp,
  formatAIUserMessage,
  formatAuthErrorMessage,
  formatDeleteAccountErrorMessage,
  formatSyncErrorMessage,
  getAuthModeMessage,
  isSyncSetupIssue,
  shiftTime
} from '../utils';

const AI_REQUEST_DEDUPE_WINDOW_MS = 10_000;
const AI_QUOTA_BACKOFF_MS = 5 * 60_000;
let lastGlobalCoachingRequestKey = '';
let lastGlobalCoachingRequestAt = 0;
let lastGlobalQuotaBackoffUntil = 0;

const taskDefaultsByEnergy: Record<EnergyLevel, { urgency: number; importance: number; estimatedMinutes: number }> = {
  high: {
    urgency: 8,
    importance: 9,
    estimatedMinutes: 90
  },
  medium: {
    urgency: 7,
    importance: 7,
    estimatedMinutes: 45
  },
  low: {
    urgency: 5,
    importance: 5,
    estimatedMinutes: 20
  }
};

function deriveEnergyLevelFromBurnoutLevel(level: 'low' | 'moderate' | 'high'): EnergyLevel {
  switch (level) {
    case 'high':
      return 'low';
    case 'moderate':
      return 'medium';
    case 'low':
    default:
      return 'high';
  }
}

export function usePaceframeApp(): PaceframeAppController {
  const [dashboard, setDashboard] = useState<DashboardState>(mockDashboard);
  const [activeTab, setActiveTab] = useState<PaceframeAppController['activeTab']>('overview');
  const [planEnergyGateOpen, setPlanEnergyGateOpen] = useState(false);
  const [planSessionEnergyLane, setPlanSessionEnergyLane] = useState<EnergyLevel | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEnergy, setNewTaskEnergy] = useState<PaceframeAppController['newTaskEnergy']>('medium');
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authStatus, setAuthStatus] = useState<PaceframeAppController['authStatus']>('idle');
  const [authMessage, setAuthMessage] = useState(getAuthModeMessage('signup'));
  const [deleteAccountStatus, setDeleteAccountStatus] = useState<PaceframeAppController['deleteAccountStatus']>('idle');
  const [deleteAccountMessage, setDeleteAccountMessage] = useState('');
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
  const [assistantConversationId, setAssistantConversationId] = useState<string | null>(null);
  const [user, setUser] = useState<PaceframeAppController['user']>(null);
  const [isAuthResolved, setIsAuthResolved] = useState(!hasFirebaseConfig);
  const [isCloudHydrated, setIsCloudHydrated] = useState(false);
  const [cloudSetupRequired, setCloudSetupRequired] = useState(false);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const [aiAttempt, setAIAttempt] = useState(0);
  const [notificationPermissionAttempted, setNotificationPermissionAttempted] = useState(false);
  const isAccountDeletionInProgressRef = useRef(false);
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
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    if (activeTab !== 'plan') {
      return;
    }

    const hasPendingTasks = dashboard.tasks.some((task) => task.status === 'pending');

    if (!hasPendingTasks) {
      setPlanEnergyGateOpen(false);
      setPlanSessionEnergyLane(null);
      return;
    }

    setPlanSessionEnergyLane(null);
    setPlanEnergyGateOpen(true);
  }, [activeTab]);

  useEffect(() => {
    if (!auth) {
      setIsAuthResolved(true);
      return;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      void (async () => {
        if (cancelled) {
          return;
        }

        if (!nextUser) {
          setUser(null);
          setIsAuthResolved(true);
          return;
        }

        try {
          await nextUser.reload();
          await nextUser.getIdToken(true);
        } catch {
          // If reload/token refresh fails, keep evaluating the live auth object.
        }

        if (cancelled) {
          return;
        }

        if (!nextUser.emailVerified) {
          try {
            await requestVerificationEmail(nextUser);
            setAuthMessage('Your email is not verified yet. Paceframe sent another verification link. Check your inbox, verify it, then sign in again.');
          } catch {
            setAuthMessage('Your email is not verified yet. Use the resend button to request another verification link.');
          }

          setAuthMode('signin');
          setAuthEmail(nextUser.email ?? '');
          setAuthPassword('');
          setAuthStatus('error');
          setDeleteAccountStatus('idle');
          setDeleteAccountMessage('');
          setUser(null);
          setIsAuthResolved(true);
          void signOut(auth!).catch(() => undefined);
          return;
        }

        setDeleteAccountStatus('idle');
        setDeleteAccountMessage('');
        setAuthStatus('idle');
        setUser(nextUser);
        setIsAuthResolved(true);
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
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
          let loadedLegacyLocalDashboard = false;
          let localDashboard: DashboardState | null = null;

          try {
            const scopedLocalDashboard = await AsyncStorage.getItem(getDashboardStorageKey(currentUser.uid));

            if (cancelled) {
              return;
            }

            if (scopedLocalDashboard) {
              localDashboard = mergeDashboardState(JSON.parse(scopedLocalDashboard) as Partial<DashboardState>);
            } else {
              const legacyLocalDashboard = await AsyncStorage.getItem(STORAGE_KEY);

              if (cancelled) {
                return;
              }

              if (legacyLocalDashboard) {
                loadedLegacyLocalDashboard = true;
                localDashboard = mergeDashboardState(JSON.parse(legacyLocalDashboard) as Partial<DashboardState>);
              }
            }

            if (localDashboard) {
              setDashboard(localDashboard);
              setSyncMessage('Cloud sync connected. Your Paceframe dashboard was loaded from this device.');
            } else {
              setDashboard(mockDashboard);
              setSyncMessage('Cloud sync connected. This device is ready to save your Paceframe state.');
            }
          } catch {
            if (cancelled) {
              return;
            }

            setDashboard(mockDashboard);
            setSyncMessage('Cloud sync connected. This device is ready to save your Paceframe state.');
          }

          if (!cancelled && loadedLegacyLocalDashboard) {
            await AsyncStorage.setItem(getDashboardStorageKey(currentUser.uid), JSON.stringify(localDashboard ?? mockDashboard));
          }
        }

        if (!cancelled) {
          await AsyncStorage.removeItem(STORAGE_KEY);
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

        try {
          const scopedLocalDashboard = await AsyncStorage.getItem(getDashboardStorageKey(currentUser.uid));

          if (cancelled) {
            return;
          }

          if (scopedLocalDashboard) {
            setDashboard(mergeDashboardState(JSON.parse(scopedLocalDashboard) as Partial<DashboardState>));
          } else {
            const legacyLocalDashboard = await AsyncStorage.getItem(STORAGE_KEY);

            if (cancelled) {
              return;
            }

            if (legacyLocalDashboard) {
              setDashboard(mergeDashboardState(JSON.parse(legacyLocalDashboard) as Partial<DashboardState>));
            } else {
              setDashboard(mockDashboard);
            }
          }
        } catch {
          if (!cancelled) {
            setDashboard(mockDashboard);
          }
        }

        if (!cancelled) {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
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
    if (!user || isAccountDeletionInProgressRef.current) {
      setAssistantConversationId(null);
      setNotificationPermissionAttempted(false);
      return;
    }

    if (!isHydrated || !dashboard.profile.onboardingComplete || !isCloudHydrated) {
      return;
    }

    const currentUser = user;
    let cancelled = false;

    async function hydrateAssistantHistory() {
      try {
        const authToken = await currentUser.getIdToken();
        const thread = await fetchLatestAssistantThread(authToken);

        if (cancelled || !thread) {
          return;
        }

        setAssistantConversationId(thread.conversationId);
        setAssistantHistory(thread.messages);
      } catch {
        if (!cancelled) {
          setAssistantConversationId(null);
        }
      }
    }

    void hydrateAssistantHistory();

    return () => {
      cancelled = true;
    };
  }, [dashboard.profile.onboardingComplete, isCloudHydrated, isHydrated, user]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (isAccountDeletionInProgressRef.current) {
      return;
    }

    const storageKey = user ? getDashboardStorageKey(user.uid) : STORAGE_KEY;

    AsyncStorage.setItem(storageKey, JSON.stringify(dashboard)).catch(() => undefined);
  }, [dashboard, isHydrated, user]);

  useEffect(() => {
    if (!user || !isHydrated || !dashboard.profile.onboardingComplete || isAccountDeletionInProgressRef.current) {
      return;
    }

    let cancelled = false;

    async function syncNotifications() {
      try {
        await syncReminderNotificationsAsync(dashboard.reminders, {
          requestPermissions: !notificationPermissionAttempted
        });

        if (!cancelled) {
          setNotificationPermissionAttempted(true);
        }
      } catch {
        if (!cancelled) {
          setNotificationPermissionAttempted(true);
        }
      }
    }

    void syncNotifications();

    return () => {
      cancelled = true;
    };
  }, [dashboard.profile.onboardingComplete, dashboard.reminders, isHydrated, notificationPermissionAttempted, user]);

  useEffect(() => {
    if (!user || !isHydrated || !isCloudHydrated || cloudSetupRequired || isAccountDeletionInProgressRef.current) {
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
    if (!user || isAccountDeletionInProgressRef.current) {
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
      setAIMessage('Paceframe AI is refreshing your coach guidance...');

      void fetchLiveCoaching(dashboard, user.email)
        .then(async (bundle) => {
          if (cancelled) {
            return;
          }

          lastGlobalQuotaBackoffUntil = 0;
          setLiveCoaching(bundle);
          setAIStatus('ready');
          setAIMessage('Live AI coaching is active and using your latest Paceframe data.');

          try {
            const authToken = await user.getIdToken();
            await persistReviewArtifacts({
              authToken,
              daily: {
                headline: bundle.dailyBrief.headline,
                summary: [bundle.dailyBrief.focusBlock, bundle.dailyBrief.recoveryAnchor].filter(Boolean).join(' '),
                payload: {
                  reasoningSummary: bundle.reasoningSummary,
                  aiCoach: bundle.aiCoach,
                  dailyBrief: bundle.dailyBrief
                },
                model: bundle.model
              },
              weekly: {
                headline: bundle.weeklyInsight.title,
                summary: bundle.weeklyInsight.summary,
                payload: {
                  experiment: bundle.weeklyInsight.experiment,
                  reasoningSummary: bundle.reasoningSummary
                },
                model: bundle.model
              }
            });
          } catch {
            // Keep live coaching usable even if review persistence fails.
          }
        })
        .catch((error) => {
          if (cancelled) {
            return;
          }

          if (error instanceof Error && error.message.toLowerCase().includes('quota')) {
            lastGlobalQuotaBackoffUntil = Date.now() + AI_QUOTA_BACKOFF_MS;
          }

          setAIStatus('error');
          setAIMessage(formatAIUserMessage(error, 'coach'));
        });
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [aiAttempt, aiRefreshFingerprint, isCloudHydrated, isHydrated, user]);

  const planningDashboard = useMemo<DashboardState>(() => {
    const hasPendingTasks = dashboard.tasks.some((task) => task.status === 'pending');
    const sessionEnergyLane =
      activeTab === 'plan'
        ? planEnergyGateOpen
          ? null
          : (planSessionEnergyLane ?? dashboard.energyState.energy)
        : dashboard.energyState.energy;

    return {
      ...dashboard,
      taskFlow: {
        ...dashboard.taskFlow,
        selectedEnergyLane: hasPendingTasks ? sessionEnergyLane : null,
        needsEnergyConfirmation: activeTab === 'plan' ? hasPendingTasks && planEnergyGateOpen : false
      }
    };
  }, [activeTab, dashboard, planEnergyGateOpen, planSessionEnergyLane]);

  const plan = useMemo(() => buildTodayPlan(planningDashboard), [planningDashboard]);
  const burnoutSignal = useMemo(() => getBurnoutSignal(dashboard.energyState), [dashboard.energyState]);
  const fallbackCoach = useMemo(() => buildAICoachCard(planningDashboard), [planningDashboard]);
  const fallbackDailyBrief = useMemo(() => buildDailyBrief(planningDashboard), [planningDashboard]);
  const fallbackWeeklyInsight = useMemo(() => buildWeeklyInsight(planningDashboard), [planningDashboard]);
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
    if (!newTaskTitle.trim() || planEnergyGateOpen) {
      return;
    }

    const taskDefaults = taskDefaultsByEnergy[newTaskEnergy];

    setDashboard((current) => ({
      ...current,
      tasks: [
        createTask({
          title: newTaskTitle,
          urgency: taskDefaults.urgency,
          importance: taskDefaults.importance,
          energyCost: newTaskEnergy,
          estimatedMinutes: taskDefaults.estimatedMinutes
        }),
        ...current.tasks
      ]
    }));
    setNewTaskTitle('');
    setNewTaskEnergy('medium');
  }

  function markTaskDone(taskId: string) {
    const nextTasks = completeTask(dashboard.tasks, taskId);
    const hasRemainingTasks = nextTasks.some((task) => task.status === 'pending');

    setPlanSessionEnergyLane(null);
    setPlanEnergyGateOpen(activeTab === 'plan' && hasRemainingTasks);

    setDashboard((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId
          ? { ...task, status: 'completed' }
          : task
      ),
      taskFlow: {
        selectedEnergyLane: null,
        needsEnergyConfirmation: hasRemainingTasks,
        workOrderingPreference: current.taskFlow.workOrderingPreference
      }
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
    setPlanEnergyGateOpen(false);
    setPlanSessionEnergyLane(null);
    setDashboard((current) => ({
      ...current,
      profile: updateUserProfile(current.profile, {
        onboardingComplete: true
      })
    }));
    setActiveTab('overview');
  }

  function completeInitialCheckIn() {
    const burnoutLevel = getBurnoutSignal(dashboard.energyState).level;
    const nextEnergy = deriveEnergyLevelFromBurnoutLevel(burnoutLevel);

    setPlanEnergyGateOpen(false);
    setPlanSessionEnergyLane(null);
    setActiveTab('overview');
    setDashboard((current) => ({
      ...current,
      energyState: updateEnergyState(current.energyState, {
        energy: nextEnergy
      }),
      taskFlow: {
        ...current.taskFlow,
        selectedEnergyLane: nextEnergy,
        needsEnergyConfirmation: false
      },
      profile: updateUserProfile(current.profile, {
        initialCheckInComplete: true
      })
    }));
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
    setPlanSessionEnergyLane(level);
    setPlanEnergyGateOpen(false);
    setDashboard((current) => ({
      ...current,
      energyState: updateEnergyState(current.energyState, {
        energy: level
      }),
      taskFlow: {
        selectedEnergyLane: null,
        needsEnergyConfirmation: false,
        workOrderingPreference: current.taskFlow.workOrderingPreference
      }
    }));
  }

  function setWorkOrderingPreference(preference: WorkOrderingPreference) {
    setDashboard((current) => ({
      ...current,
      taskFlow: {
        ...current.taskFlow,
        workOrderingPreference: preference
      }
    }));
  }

  function handleTabChange(tab: PaceframeAppController['activeTab']) {
    if (dashboard.profile.onboardingComplete && !dashboard.profile.initialCheckInComplete && tab !== 'overview') {
      return;
    }

    const hasPendingTasks = dashboard.tasks.some((task) => task.status === 'pending');

    if (tab === 'plan') {
      setPlanSessionEnergyLane(null);
      setPlanEnergyGateOpen(hasPendingTasks);
    } else {
      setPlanEnergyGateOpen(false);
      setPlanSessionEnergyLane(null);
    }

    setActiveTab(tab);
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
      const assistantMeta = [
        reply.planSteps.length > 0 ? reply.planSteps.map((step, index) => `${index + 1}. ${step}`).join('\n') : '',
        `Next: ${reply.suggestedAction}`,
        reply.supportiveNote ? `Support: ${reply.supportiveNote}` : '',
        reply.followUpQuestion ? `Follow-up: ${reply.followUpQuestion}` : ''
      ]
        .filter(Boolean)
        .join('\n\n');

      const assistantEntry = {
        id: `${Date.now()}-assistant`,
        role: 'assistant' as const,
        text: `${reply.headline}\n\n${reply.answer}`,
        meta: assistantMeta
      };

      setAssistantReply(reply);
      setAssistantHistory((current) => [...current, assistantEntry]);
      setAssistantStatus('ready');
      setAssistantMessage('Answered from your current Paceframe data.');

      try {
        const authToken = await user.getIdToken();
        const nextConversationId = await persistAssistantConversation({
          authToken,
          conversationId: assistantConversationId,
          title: question,
          messages: [
            {
              role: 'user',
              text: question
            },
            {
              role: 'assistant',
              text: assistantEntry.text,
              meta: assistantEntry.meta
            }
          ]
        });

        if (nextConversationId) {
          setAssistantConversationId(nextConversationId);
        }
      } catch {
        // Keep the local chat responsive even if history persistence fails.
      }
    } catch (error) {
      setAssistantStatus('error');
      setAssistantMessage(formatAIUserMessage(error, 'assistant'));
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
        try {
          await requestVerificationEmail(credential.user);
          setAuthStatus('sent');
          setAuthMessage('Account created. Check your email, verify it on the web page, then return to log in.');
        } catch (error) {
          setAuthStatus('error');
          setAuthMessage(
            error instanceof Error && error.message.trim()
              ? error.message
              : 'Account created, but the verification email could not be sent yet.'
          );
        } finally {
          await signOut(auth);
        }
        return;
      }

      if (authMode === 'signin') {
        const credential = await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        await credential.user.reload();
        await credential.user.getIdToken(true);

        if (!credential.user.emailVerified) {
          try {
            await requestVerificationEmail(credential.user);
            setAuthMessage('Your email is not verified yet. Paceframe sent another verification link. Check your inbox, verify it, then sign in again.');
          } catch {
            setAuthMessage('Your email is not verified yet. Use the resend button to request another verification link.');
          }

          setAuthStatus('error');
          setAuthMode('signin');
          setAuthPassword('');
          await signOut(auth).catch(() => undefined);
          return;
        }

        setDeleteAccountStatus('idle');
        setDeleteAccountMessage('');
        setAuthStatus('idle');
        setAuthMessage('Signed in successfully.');
        return;
      }

      await requestPasswordResetEmail(authEmail.trim());
      setAuthStatus('sent');
      setAuthMessage('Password reset email sent. Open the web link to finish resetting, then log in again in the app.');
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(formatAuthErrorMessage(error, authMode));
    }
  }

  async function handleResendVerificationEmail() {
    const email = authEmail.trim();

    if (!email) {
      setAuthStatus('error');
      setAuthMessage('Enter your email address first.');
      return;
    }

    try {
      setAuthStatus('working');
      await requestVerificationEmailByEmail(email);
      setAuthStatus('sent');
      setAuthMessage('Verification email resent. Check your inbox, verify it, then sign back in.');
    } catch (error) {
      setAuthStatus('error');
      setAuthMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : 'We could not resend the verification email right now. Try again in a moment.'
      );
    }
  }

  async function handleDeleteAccount() {
    if (!auth?.currentUser) {
      setDeleteAccountStatus('error');
      setDeleteAccountMessage('Sign in first to delete your Paceframe account.');
      return;
    }

    const currentUser = auth.currentUser;
    isAccountDeletionInProgressRef.current = true;
    setDeleteAccountStatus('working');
    setDeleteAccountMessage('Removing your Paceframe account, synced cloud data, and local cache...');

    try {
      await cancelAllReminderNotificationsAsync().catch(() => undefined);
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(getDashboardStorageKey(currentUser.uid));
      setDashboard(mockDashboard);

      await deleteRemoteUserData(currentUser);
      await deleteUser(currentUser);

      setDeleteAccountStatus('done');
      setDeleteAccountMessage('Your Paceframe account was deleted.');
      setAuthMode('signup');
      setAuthEmail('');
      setAuthPassword('');
      setAuthStatus('idle');
      setAuthMessage('Your Paceframe account was deleted. Create a new one if you want to return.');
    } catch (error) {
      const message = formatDeleteAccountErrorMessage(error);
      setDeleteAccountStatus('error');
      setDeleteAccountMessage(message);
      setAuthMode('signin');
      setAuthPassword('');
      setAuthStatus('error');
      setAuthMessage(message);
    } finally {
      await signOut(auth).catch(() => undefined);
      isAccountDeletionInProgressRef.current = false;
    }
  }

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    await cancelAllReminderNotificationsAsync().catch(() => undefined);
    await signOut(auth);
    setAuthStatus('idle');
    setAuthMessage('Signed out. Sign back in whenever you are ready.');
    setDeleteAccountStatus('idle');
    setDeleteAccountMessage('');
  }

  return {
    dashboard,
    activeTab,
    setActiveTab: handleTabChange,
    planEnergyGateOpen,
    currentPlanEnergyLane: planSessionEnergyLane,
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
    deleteAccountStatus,
    deleteAccountMessage,
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
    isCloudHydrated,
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
    handleResendVerificationEmail,
    handleSignOut,
    handleDeleteAccount,
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
    completeInitialCheckIn,
    retryCloudSync,
    retryLiveCoaching,
    selectEnergyLane,
    setWorkOrderingPreference,
    submitAssistantQuestion
  };
}
