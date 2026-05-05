import type {
  AICoachCard,
  BurnoutSignal,
  BurnoutLevel,
  CarePlan,
  CheckIn,
  DailyBrief,
  DashboardState,
  EnergyLevel,
  EnergyState,
  PlanningStyle,
  PrioritizedTask,
  RecoveryProtocol,
  TaskItem,
  TodayPlan,
  UserProfile,
  WeeklyInsight,
  WeeklySummary
} from './domain';
import { mockDashboard } from './mock';

const energyWeight: Record<EnergyLevel, number> = {
  low: 1,
  medium: 2,
  high: 3
};

function currentEnergyWeight(level: EnergyLevel) {
  return energyWeight[level];
}

const energyLaneFallbackOrder: Record<EnergyLevel, EnergyLevel[]> = {
  high: ['high', 'medium', 'low'],
  medium: ['medium', 'low', 'high'],
  low: ['low', 'medium', 'high']
};

export function buildTodayPlan(state: DashboardState): TodayPlan {
  const prioritizedTasks = rankPendingTasks(state);
  const burnout = getBurnoutSignal(state.energyState);
  const recoveryBlocks = buildRecoveryBlocks(state.energyState, state.profile);
  const essentials = buildEssentials(state.energyState, state.checkIn);

  if (prioritizedTasks.length === 0) {
    return {
      prioritizedTasks,
      visiblePriorityTasks: [],
      leadTask: null,
      activeEnergyLane: null,
      fallbackLaneUsed: null,
      needsEnergyConfirmation: false,
      recoveryBlocks,
      essentials
    };
  }

  if (burnout.level === 'high') {
    return {
      prioritizedTasks,
      visiblePriorityTasks: prioritizedTasks,
      leadTask: prioritizedTasks[0] ?? null,
      activeEnergyLane: null,
      fallbackLaneUsed: null,
      needsEnergyConfirmation: false,
      recoveryBlocks,
      essentials
    };
  }

  const needsEnergyConfirmation = state.taskFlow.needsEnergyConfirmation || !state.taskFlow.selectedEnergyLane;

  if (needsEnergyConfirmation) {
    return {
      prioritizedTasks,
      visiblePriorityTasks: [],
      leadTask: null,
      activeEnergyLane: null,
      fallbackLaneUsed: null,
      needsEnergyConfirmation: true,
      recoveryBlocks,
      essentials
    };
  }

  const requestedLane = state.taskFlow.selectedEnergyLane ?? state.energyState.energy;
  const { visibleTasks, resolvedLane } = resolveTasksForEnergyLane(prioritizedTasks, requestedLane);

  return {
    prioritizedTasks,
    visiblePriorityTasks: visibleTasks,
    leadTask: visibleTasks[0] ?? null,
    activeEnergyLane: resolvedLane,
    fallbackLaneUsed: resolvedLane !== requestedLane ? resolvedLane : null,
    needsEnergyConfirmation: false,
    recoveryBlocks,
    essentials
  };
}

function rankPendingTasks(state: DashboardState): PrioritizedTask[] {
  const availableEnergy = currentEnergyWeight(state.energyState.energy);

  return state.tasks
    .filter((task) => task.status === 'pending')
    .map((task) => {
      const fitBonus = availableEnergy >= currentEnergyWeight(task.energyCost) ? 4 : -3;
      const planningStyleBonus =
        state.profile.planningStyle === 'ambitious'
          ? task.importance >= 8 ? 2 : 0
          : state.profile.planningStyle === 'protective' && task.energyCost === 'low'
            ? 2
            : 0;
      const recoveryPenalty =
        state.energyState.stressLevel >= 7 && task.energyCost === 'high'
          ? state.profile.planningStyle === 'protective' ? -6 : -4
          : 0;
      const fatiguePenalty = state.energyState.screenFatigue >= 7 && task.energyCost !== 'low' ? -2 : 0;
      const priorityScore = task.urgency * 2 + task.importance * 3 + fitBonus + planningStyleBonus + recoveryPenalty + fatiguePenalty;
      return { ...task, priorityScore };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore);
}

function resolveTasksForEnergyLane(tasks: PrioritizedTask[], requestedLane: EnergyLevel) {
  const candidateLanes = energyLaneFallbackOrder[requestedLane];

  for (const lane of candidateLanes) {
    const matchingTasks = tasks.filter((task) => task.energyCost === lane);
    if (matchingTasks.length > 0) {
      return {
        visibleTasks: matchingTasks,
        resolvedLane: lane
      };
    }
  }

  return {
    visibleTasks: tasks,
    resolvedLane: requestedLane
  };
}

function buildRecoveryBlocks(energyState: EnergyState, profile: UserProfile) {
  const blocks = [
    { label: 'Morning hydration + daylight', window: 'Within 30 minutes of waking' },
    { label: 'Protein and movement reset', window: '12:00 PM - 1:30 PM' }
  ];

  if (profile.crashWindow === 'morning') {
    blocks.push({ label: 'Slow-start focus ramp', window: 'Before your first deep work block' });
  }

  if (profile.crashWindow === 'afternoon') {
    blocks.push({ label: 'Protect the afternoon dip', window: '2:30 PM - 3:00 PM' });
  }

  if (profile.crashWindow === 'evening') {
    blocks.push({ label: 'Early evening shutdown buffer', window: 'Before your last work block' });
  }

  if (energyState.screenFatigue >= 7) {
    blocks.push({ label: 'No-scroll decompression block', window: '4:30 PM - 5:00 PM' });
  }

  if (energyState.stressLevel >= 8) {
    blocks.push({ label: 'Evening nervous system downshift', window: '9:00 PM - 9:30 PM' });
  }

  return blocks;
}

function buildEssentials(energyState: EnergyState, checkIn: CheckIn) {
  const essentials = ['Eat before deep work', 'Protect one no-phone reset'];

  if (energyState.movementMinutes < 15) {
    essentials.push('Add a 10 minute walk before your second work block');
  }

  if (checkIn.sleepQuality <= 5) {
    essentials.push('Shrink today to one cognitively heavy task');
  }

  return essentials;
}

export function getBurnoutSignal(state: EnergyState): BurnoutSignal {
  const sleepPenalty = 10 - state.sleepQuality;
  const weightedScore = Math.round(
    state.stressLevel * 4 +
      state.screenFatigue * 4 +
      sleepPenalty * 2
  );

  if (weightedScore >= 70) {
    return {
      level: 'high',
      score: weightedScore,
      summary: 'Your system is signaling overload. Protect attention, reduce decision load, and shift to recovery-friendly tasks.'
    };
  }

  if (weightedScore >= 45) {
    return {
      level: 'moderate',
      score: weightedScore,
      summary: 'You are carrying enough load that a hard push may backfire. Add reset blocks before deep work.'
    };
  }

  return {
    level: 'low',
    score: weightedScore,
    summary: 'Your current state supports normal execution. Protect momentum with light maintenance breaks.'
  };
}

export function buildWeeklyInsight(state: DashboardState): WeeklyInsight {
  const burnout = getBurnoutSignal(state.energyState);

  if (burnout.level === 'high') {
    return {
      title: 'Recovery has to lead this week',
      summary: 'Your workload is still asking for high output while your nervous system is asking for less stimulation and fewer open loops.',
      experiment: 'Create a minimum viable day with one must-do task, one meal checkpoint, and one off-screen break.'
    };
  }

  if (burnout.level === 'moderate') {
    return {
      title: 'You need fewer context switches',
      summary: 'Your energy is good enough to move, but scattered enough that shallow work can quietly burn the whole day.',
      experiment: 'Batch low-energy admin after lunch and protect your highest-energy block for one meaningful task.'
    };
  }

  return {
    title: 'Momentum is available',
    summary: 'Your state supports steady execution, so the goal is protecting rhythm rather than forcing more intensity.',
    experiment: 'Use short maintenance breaks so the day stays stable instead of peaking and crashing.'
  };
}

export function buildAICoachCard(state: DashboardState): AICoachCard {
  const burnout = getBurnoutSignal(state.energyState);
  const plan = buildTodayPlan(state);
  const topTask = plan.leadTask ?? plan.prioritizedTasks[0];

  if (plan.needsEnergyConfirmation) {
    return {
      title: 'AI coach says: pick your current energy before you choose the work',
      message: 'Paceframe needs a quick high, medium, or low energy check so it can show the safest next task instead of assuming too much.',
      nextAction: 'Open the Plan tab and choose your current energy lane before starting the next block.',
      protectBoundary: 'Do not commit to the next task until the lane matches your real capacity.'
    };
  }

  if (burnout.level === 'high') {
    return {
      title: 'AI coach says: reduce pressure before you optimize output',
      message: 'Your current signals suggest that trying harder is likely to create more drag, not more progress.',
      nextAction: 'Shrink today to one must-do task, one meal, one movement block, and one no-screen reset.',
      protectBoundary: 'Do not open new work after your final reset block.'
    };
  }

  if (burnout.level === 'moderate') {
    return {
      title: 'AI coach says: protect your best block from admin drift',
      message: `You still have usable momentum, but your day will blur fast if everything gets equal weight.`,
      nextAction: topTask ? `Start with "${topTask.title}" before you touch lower-stakes tasks.` : 'Start with the hardest meaningful task before switching contexts.',
      protectBoundary: 'Do not let low-energy cleanup consume the first half of the day.'
    };
  }

  return {
    title: 'AI coach says: your system can handle steady execution',
    message: 'Today is more about protecting rhythm than rescuing yourself from overload.',
    nextAction: topTask ? `Use your strongest focus window on "${topTask.title}".` : 'Use your strongest focus window on one meaningful task.',
    protectBoundary: 'Keep short breaks in place so good momentum does not turn into an avoidable crash.'
  };
}

export function buildDailyBrief(state: DashboardState): DailyBrief {
  const plan = buildTodayPlan(state);
  const coach = buildAICoachCard(state);
  const topTask = plan.leadTask ?? plan.prioritizedTasks[0];

  if (plan.needsEnergyConfirmation) {
    return {
      headline: coach.title,
      focusBlock: 'Choose high, medium, or low energy in the Plan tab before Paceframe recommends the next task.',
      recoveryAnchor: plan.recoveryBlocks[0]
        ? `${plan.recoveryBlocks[0].label} — ${plan.recoveryBlocks[0].window}.`
        : 'Take one intentional no-phone recovery block today.'
    };
  }

  return {
    headline: coach.title,
    focusBlock: topTask
      ? `Primary focus: ${topTask.title} for about ${topTask.estimatedMinutes} minutes.`
      : 'Primary focus: keep the day light and protect your energy.',
    recoveryAnchor: plan.recoveryBlocks[0]
      ? `${plan.recoveryBlocks[0].label} — ${plan.recoveryBlocks[0].window}.`
      : 'Take one intentional no-phone recovery block today.'
  };
}

export function buildWeeklySummary(state: DashboardState): WeeklySummary {
  const completedTasks = state.tasks.filter((task) => task.status === 'completed').length;
  const totalTasks = state.tasks.length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const averageStressLoad = Math.round((state.energyState.stressLevel + state.energyState.screenFatigue) / 2);
  const careConsistency = calculateCareConsistency(state.carePlan);

  let protectiveAction = 'Keep your current rhythm and preserve your best focus window.';
  if (averageStressLoad >= 8) {
    protectiveAction = 'Reduce cognitive load and replace one late-day work block with recovery.';
  } else if (averageStressLoad >= 6) {
    protectiveAction = 'Protect transitions between meetings and solo work with short resets.';
  }

  return {
    completionRate,
    completedTasks,
    totalTasks,
    averageStressLoad,
    careConsistency,
    protectiveAction
  };
}

export function updateEnergyState(state: EnergyState, patch: Partial<EnergyState>): EnergyState {
  return { ...state, ...patch };
}

export function createTask(input: {
  title: string;
  urgency: number;
  importance: number;
  energyCost: EnergyLevel;
  estimatedMinutes: number;
}): TaskItem {
  return {
    id: `task-${Math.random().toString(36).slice(2, 10)}`,
    title: input.title.trim(),
    urgency: input.urgency,
    importance: input.importance,
    energyCost: input.energyCost,
    estimatedMinutes: input.estimatedMinutes,
    status: 'pending'
  };
}

export function completeTask(tasks: TaskItem[], taskId: string): TaskItem[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, status: 'completed' }
      : task
  );
}

export function reopenTask(tasks: TaskItem[], taskId: string): TaskItem[] {
  return tasks.map((task) =>
    task.id === taskId
      ? { ...task, status: 'pending' }
      : task
  );
}

export function getOpenTasks(tasks: TaskItem[]) {
  return tasks.filter((task) => task.status === 'pending');
}

export function getCompletedTasks(tasks: TaskItem[]) {
  return tasks.filter((task) => task.status === 'completed');
}

export function updateCarePlanMetric(
  carePlan: CarePlan,
  key: 'hydrationDone' | 'mealsDone' | 'movementDone' | 'restDone',
  direction: -1 | 1
) {
  const targetKey = key.replace('Done', 'Target') as 'hydrationTarget' | 'mealsTarget' | 'movementTarget' | 'restTarget';
  const nextValue = clampNumber(carePlan[key] + direction, 0, carePlan[targetKey]);
  return {
    ...carePlan,
    [key]: nextValue
  };
}

export function updateCarePlanTarget(
  carePlan: CarePlan,
  key: 'hydrationTarget' | 'mealsTarget' | 'movementTarget' | 'restTarget',
  direction: -1 | 1
) {
  const nextTarget = clampNumber(carePlan[key] + direction, 1, 12);
  const doneKey = key.replace('Target', 'Done') as 'hydrationDone' | 'mealsDone' | 'movementDone' | 'restDone';

  return {
    ...carePlan,
    [key]: nextTarget,
    [doneKey]: Math.min(carePlan[doneKey], nextTarget)
  };
}

export function updateUserProfile(
  profile: UserProfile,
  patch: Partial<UserProfile>
) {
  const nextProfile = {
    ...profile,
    ...patch
  };

  if (patch.planningStyle) {
    return {
      ...nextProfile,
      planningStyle: patch.planningStyle
    };
  }

  return nextProfile;
}

export function getFocusLabelForPlanningStyle(style: PlanningStyle) {
  if (style === 'protective') {
    return 'Guard your bandwidth';
  }

  if (style === 'ambitious') {
    return 'Use your best block';
  }

  return 'Keep a steady pace';
}

export function updateReflection(
  reflection: DashboardState['reflection'],
  patch: Partial<DashboardState['reflection']>
) {
  return {
    ...reflection,
    ...patch
  };
}

export function toggleReminder(
  reminders: DashboardState['reminders'],
  reminderId: string
) {
  return reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, enabled: !reminder.enabled } : reminder
  );
}

export function updateReminderTime(
  reminders: DashboardState['reminders'],
  reminderId: string,
  time: string
) {
  return reminders.map((reminder) =>
    reminder.id === reminderId ? { ...reminder, time } : reminder
  );
}

export function calculateCareConsistency(carePlan: CarePlan) {
  const buckets = [
    carePlan.hydrationTarget === 0 ? 1 : carePlan.hydrationDone / carePlan.hydrationTarget,
    carePlan.mealsTarget === 0 ? 1 : carePlan.mealsDone / carePlan.mealsTarget,
    carePlan.movementTarget === 0 ? 1 : carePlan.movementDone / carePlan.movementTarget,
    carePlan.restTarget === 0 ? 1 : carePlan.restDone / carePlan.restTarget
  ];
  const average = buckets.reduce((sum, value) => sum + value, 0) / buckets.length;
  return Math.round(average * 100);
}

export function mergeDashboardState(input: Partial<DashboardState> | null | undefined): DashboardState {
  return {
    ...mockDashboard,
    ...(input ?? {}),
    profile: {
      ...mockDashboard.profile,
      ...(input?.profile ?? {})
    },
    energyState: {
      ...mockDashboard.energyState,
      ...(input?.energyState ?? {})
    },
    checkIn: {
      ...mockDashboard.checkIn,
      ...(input?.checkIn ?? {})
    },
    carePlan: {
      ...mockDashboard.carePlan,
      ...(input?.carePlan ?? {})
    },
    reflection: {
      ...mockDashboard.reflection,
      ...(input?.reflection ?? {})
    },
    taskFlow: {
      ...mockDashboard.taskFlow,
      ...(input?.taskFlow ?? {})
    },
    tasks: Array.isArray(input?.tasks) ? input.tasks : mockDashboard.tasks,
    routines: Array.isArray(input?.routines) ? input.routines : mockDashboard.routines,
    reminders: Array.isArray(input?.reminders) ? input.reminders : mockDashboard.reminders,
    weeklyBurnoutScores: Array.isArray(input?.weeklyBurnoutScores) ? input.weeklyBurnoutScores : mockDashboard.weeklyBurnoutScores,
    streakDays: typeof input?.streakDays === 'number' ? input.streakDays : mockDashboard.streakDays
  };
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export const recoveryProtocols: Record<BurnoutLevel, RecoveryProtocol[]> = {
  low: [
    {
      id: 'walk-reset',
      title: '10 minute walk with no phone',
      duration: '10 min',
      description: 'Use movement to protect momentum before stress starts stacking.'
    },
    {
      id: 'meal-check',
      title: 'Eat something sustaining before next block',
      duration: '20 min',
      description: 'Prevent avoidable energy drops that later feel like motivation problems.'
    }
  ],
  moderate: [
    {
      id: 'close-loops',
      title: 'Close tabs and clear visual overload',
      duration: '15 min',
      description: 'Reduce open-loop anxiety before returning to meaningful work.'
    },
    {
      id: 'body-reset',
      title: 'Hydrate, breathe, and stretch before working again',
      duration: '20 min',
      description: 'Signal safety to your body so effort does not feel like pressure.'
    }
  ],
  high: [
    {
      id: 'offline-reset',
      title: 'Step away from all screens and reduce stimulation',
      duration: '30 min',
      description: 'Prioritize nervous system recovery before any additional planning.'
    },
    {
      id: 'minimum-viable-day',
      title: 'Shrink the plan to one essential task and basic care',
      duration: '45 min',
      description: 'Trade intensity for stability so the rest of the week is still recoverable.'
    }
  ]
};
