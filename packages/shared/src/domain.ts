export type EnergyLevel = 'low' | 'medium' | 'high';
export type BurnoutLevel = 'low' | 'moderate' | 'high';
export type TaskStatus = 'pending' | 'completed';
export type ReminderKind = 'eat' | 'move' | 'rest' | 'hydrate';
export type PlanningStyle = 'steady' | 'protective' | 'ambitious';
export type CrashWindow = 'morning' | 'afternoon' | 'evening';

export interface EnergyState {
  focusLabel: string;
  energy: EnergyLevel;
  sleepQuality: number;
  stressLevel: number;
  screenFatigue: number;
  movementMinutes: number;
}

export interface TaskItem {
  id: string;
  title: string;
  urgency: number;
  importance: number;
  energyCost: EnergyLevel;
  estimatedMinutes: number;
  status: TaskStatus;
}

export interface CheckIn {
  mood: number;
  stressLevel: number;
  sleepQuality: number;
  screenFatigue: number;
  wins: string[];
  supportNeeded: string;
}

export interface RecoveryBlock {
  label: string;
  window: string;
}

export interface RoutineItem {
  id: string;
  title: string;
  cue: string;
  energyMatch: EnergyLevel | 'all';
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  kind: ReminderKind;
  enabled: boolean;
  note: string;
}

export interface CarePlan {
  hydrationTarget: number;
  hydrationDone: number;
  mealsTarget: number;
  mealsDone: number;
  movementTarget: number;
  movementDone: number;
  restTarget: number;
  restDone: number;
}

export interface WeeklyInsight {
  title: string;
  summary: string;
  experiment: string;
}

export interface ReflectionState {
  intention: string;
  eveningNote: string;
  gratitude: string;
}

export interface UserProfile {
  firstName: string;
  roleLabel: string;
  primaryGoal: string;
  planningStyle: PlanningStyle;
  crashWindow: CrashWindow;
  onboardingComplete: boolean;
}

export interface AICoachCard {
  title: string;
  message: string;
  nextAction: string;
  protectBoundary: string;
}

export interface DailyBrief {
  headline: string;
  focusBlock: string;
  recoveryAnchor: string;
}

export interface LiveCoachingBundle {
  aiCoach: AICoachCard;
  dailyBrief: DailyBrief;
  weeklyInsight: WeeklyInsight;
  reasoningSummary: string;
  generatedAt: string;
  model: string;
}

export interface DashboardState {
  profile: UserProfile;
  energyState: EnergyState;
  tasks: TaskItem[];
  checkIn: CheckIn;
  routines: RoutineItem[];
  reminders: ReminderItem[];
  carePlan: CarePlan;
  reflection: ReflectionState;
  weeklyBurnoutScores: number[];
  streakDays: number;
}

export interface PrioritizedTask extends TaskItem {
  priorityScore: number;
}

export interface TodayPlan {
  prioritizedTasks: PrioritizedTask[];
  recoveryBlocks: RecoveryBlock[];
  essentials: string[];
}

export interface RecoveryProtocol {
  id: string;
  title: string;
  duration: string;
  description: string;
}

export interface WeeklySummary {
  completionRate: number;
  completedTasks: number;
  totalTasks: number;
  averageStressLoad: number;
  careConsistency: number;
  protectiveAction: string;
}

export interface BurnoutSignal {
  level: BurnoutLevel;
  score: number;
  summary: string;
}
