import type { User } from 'firebase/auth';
import type {
  AICoachCard,
  LiveCoachingBundle,
  BurnoutSignal,
  CrashWindow,
  DashboardState,
  DailyBrief,
  EnergyLevel,
  PlanningStyle,
  PrioritizedTask,
  ReminderItem,
  WeeklyInsight,
  WeeklySummary
} from '@paceframe/shared';

export type Tab = 'overview' | 'plan' | 'checkin' | 'reset' | 'account';
export type AuthMode = 'signup' | 'signin' | 'reset';
export type AuthStatus = 'idle' | 'working' | 'sent' | 'error';
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'setup';
export type AIStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PaceframeAppController {
  dashboard: DashboardState;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  newTaskTitle: string;
  setNewTaskTitle: (value: string) => void;
  newTaskEnergy: EnergyLevel;
  setNewTaskEnergy: (value: EnergyLevel) => void;
  authMode: AuthMode;
  authEmail: string;
  setAuthEmail: (value: string) => void;
  authPassword: string;
  setAuthPassword: (value: string) => void;
  authStatus: AuthStatus;
  authMessage: string;
  authReady: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  aiStatus: AIStatus;
  aiMessage: string;
  liveCoaching: LiveCoachingBundle | null;
  user: User | null;
  isReady: boolean;
  plan: {
    prioritizedTasks: PrioritizedTask[];
    recoveryBlocks: Array<{ label: string; window: string }>;
    essentials: string[];
  };
  burnoutSignal: BurnoutSignal;
  aiCoach: AICoachCard;
  dailyBrief: DailyBrief;
  weeklyInsight: WeeklyInsight;
  weeklySummary: WeeklySummary;
  completedTasks: DashboardState['tasks'];
  careConsistency: number;
  nextReminders: ReminderItem[];
  handleAuthModeChange: (mode: AuthMode) => void;
  handleAuthSubmit: () => Promise<void>;
  handleSignOut: () => Promise<void>;
  adjustEnergy: (metric: 'stressLevel' | 'screenFatigue', direction: -1 | 1) => void;
  adjustSleepTrouble: (direction: -1 | 1) => void;
  handleAddTask: () => void;
  markTaskDone: (taskId: string) => void;
  reopenCompletedTask: (taskId: string) => void;
  adjustCareMetric: (key: 'hydrationDone' | 'mealsDone' | 'movementDone' | 'restDone', direction: -1 | 1) => void;
  adjustCareTarget: (key: 'hydrationTarget' | 'mealsTarget' | 'movementTarget' | 'restTarget', direction: -1 | 1) => void;
  toggleReminderEnabled: (reminderId: string) => void;
  shiftReminder: (reminderId: string, direction: -1 | 1) => void;
  updateReflectionField: (field: 'intention' | 'eveningNote' | 'gratitude', value: string) => void;
  updateProfileField: (field: 'firstName' | 'roleLabel' | 'primaryGoal', value: string) => void;
  setPlanningStyle: (style: PlanningStyle) => void;
  setCrashWindow: (window: CrashWindow) => void;
  completeOnboarding: () => void;
  retryCloudSync: () => void;
  retryLiveCoaching: () => void;
}
