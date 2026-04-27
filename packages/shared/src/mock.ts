import type { DashboardState } from './domain';

export const mockDashboard: DashboardState = {
  profile: {
    firstName: 'Sugi',
    roleLabel: 'Founder',
    primaryGoal: 'protect energy while still shipping meaningful work',
    planningStyle: 'protective',
    crashWindow: 'afternoon',
    onboardingComplete: true
  },
  energyState: {
    focusLabel: 'Guard your bandwidth',
    energy: 'medium',
    sleepQuality: 6,
    stressLevel: 7,
    screenFatigue: 8,
    movementMinutes: 12
  },
  checkIn: {
    mood: 6,
    stressLevel: 7,
    sleepQuality: 6,
    screenFatigue: 8,
    wins: ['Ate breakfast before work', 'Finished one important email'],
    supportNeeded: 'Less context switching in the second half of the day'
  },
  routines: [
    {
      id: 'morning-landing',
      title: 'Morning landing',
      cue: 'Wake up',
      energyMatch: 'all'
    },
    {
      id: 'midday-reset',
      title: 'Midday reset',
      cue: 'Before afternoon work',
      energyMatch: 'medium'
    },
    {
      id: 'evening-offramp',
      title: 'Evening off-ramp',
      cue: 'After dinner',
      energyMatch: 'low'
    }
  ],
  reminders: [
    {
      id: 'reminder-breakfast',
      title: 'Eat something real',
      time: '09:30',
      kind: 'eat',
      enabled: true,
      note: 'Prevent the late-morning crash.'
    },
    {
      id: 'reminder-move',
      title: 'Stand up and move',
      time: '13:30',
      kind: 'move',
      enabled: true,
      note: 'Short movement before the second focus block.'
    },
    {
      id: 'reminder-rest',
      title: 'No-phone reset',
      time: '17:00',
      kind: 'rest',
      enabled: true,
      note: 'Protect the transition out of work mode.'
    },
    {
      id: 'reminder-water',
      title: 'Hydration check',
      time: '15:00',
      kind: 'hydrate',
      enabled: false,
      note: 'A small water check before fatigue spikes.'
    }
  ],
  carePlan: {
    hydrationTarget: 8,
    hydrationDone: 3,
    mealsTarget: 3,
    mealsDone: 1,
    movementTarget: 3,
    movementDone: 1,
    restTarget: 2,
    restDone: 0
  },
  reflection: {
    intention: 'Protect my best focus for one meaningful task and do not turn the whole day into cleanup work.',
    eveningNote: 'I tend to overwork when I feel behind, even when rest would help more.',
    gratitude: 'A calmer afternoon after I finally stepped away from the screen.'
  },
  weeklyBurnoutScores: [52, 58, 61, 49, 44, 39, 42],
  streakDays: 4,
  tasks: [
    {
      id: 'task-1',
      title: 'Prepare investor update',
      urgency: 8,
      importance: 9,
      energyCost: 'high',
      estimatedMinutes: 90,
      status: 'pending'
    },
    {
      id: 'task-2',
      title: 'Reply to partnership email',
      urgency: 7,
      importance: 6,
      energyCost: 'low',
      estimatedMinutes: 20,
      status: 'completed'
    },
    {
      id: 'task-3',
      title: 'Refine onboarding copy',
      urgency: 6,
      importance: 8,
      energyCost: 'medium',
      estimatedMinutes: 45,
      status: 'pending'
    }
  ]
};
