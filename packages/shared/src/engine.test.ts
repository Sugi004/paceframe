import { describe, expect, it } from 'vitest';
import {
  buildAICoachCard,
  buildTodayPlan,
  buildWeeklySummary,
  calculateCareConsistency,
  completeTask,
  createTask,
  getBurnoutSignal,
  mergeDashboardState,
  mockDashboard
} from './index';
import type { DashboardState } from './domain';

describe('planning engine', () => {
  it('requires energy confirmation on moderate burnout days before revealing a lead task', () => {
    const plan = buildTodayPlan(mockDashboard);

    expect(plan.needsEnergyConfirmation).toBe(true);
    expect(plan.leadTask).toBeNull();
    expect(plan.visiblePriorityTasks).toHaveLength(0);
    expect(plan.prioritizedTasks.length).toBeGreaterThan(0);
    expect(plan.essentials.length).toBeGreaterThan(1);
  });

  it('requires energy confirmation even on high burnout days until the user picks a lane', () => {
    const highBurnoutState = mergeDashboardState({
      energyState: {
        ...mockDashboard.energyState,
        stressLevel: 9,
        screenFatigue: 9,
        sleepQuality: 4
      },
      taskFlow: {
        selectedEnergyLane: null,
        needsEnergyConfirmation: true,
        workOrderingPreference: 'paceframe'
      }
    });

    const plan = buildTodayPlan(highBurnoutState);

    expect(plan.needsEnergyConfirmation).toBe(true);
    expect(plan.leadTask).toBeNull();
    expect(plan.visiblePriorityTasks).toHaveLength(0);
  });

  it('reorders the visible priority stack to put the selected energy lane first', () => {
    const laneSelectedState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'high',
        needsEnergyConfirmation: false,
        workOrderingPreference: 'paceframe'
      }
    });

    const plan = buildTodayPlan(laneSelectedState);

    expect(plan.needsEnergyConfirmation).toBe(false);
    expect(plan.activeEnergyLane).toBe('high');
    expect(plan.leadTask?.title).toBe('Prepare investor update');
    expect(plan.visiblePriorityTasks.map((task) => task.energyCost)).toEqual(['high', 'medium']);
  });

  it('falls back to the nearest lane when the selected lane has no matching tasks', () => {
    const fallbackState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'low',
        needsEnergyConfirmation: false,
        workOrderingPreference: 'paceframe'
      },
      tasks: [
        {
          id: 'task-a',
          title: 'Deep strategy review',
          urgency: 8,
          importance: 9,
          energyCost: 'high',
          estimatedMinutes: 75,
          status: 'pending'
        },
        {
          id: 'task-b',
          title: 'Refine launch copy',
          urgency: 6,
          importance: 8,
          energyCost: 'medium',
          estimatedMinutes: 40,
          status: 'pending'
        }
      ]
    });

    const plan = buildTodayPlan(fallbackState);

    expect(plan.activeEnergyLane).toBe('medium');
    expect(plan.fallbackLaneUsed).toBe('medium');
    expect(plan.visiblePriorityTasks).toHaveLength(2);
    expect(plan.visiblePriorityTasks.map((task) => task.title)).toEqual([
      'Refine launch copy',
      'Deep strategy review'
    ]);
  });

  it('breaks priority ties in a deterministic order instead of using insertion order', () => {
    const tiedState = mergeDashboardState({
      energyState: {
        ...mockDashboard.energyState,
        stressLevel: 3,
        screenFatigue: 3,
        sleepQuality: 8
      },
      taskFlow: {
        selectedEnergyLane: 'medium',
        needsEnergyConfirmation: false,
        workOrderingPreference: 'paceframe'
      },
      tasks: [
        {
          id: 'task-z',
          title: 'Lower urgency medium task',
          urgency: 6,
          importance: 7,
          energyCost: 'medium',
          estimatedMinutes: 40,
          status: 'pending'
        },
        {
          id: 'task-a',
          title: 'Higher urgency medium task',
          urgency: 8,
          importance: 7,
          energyCost: 'medium',
          estimatedMinutes: 40,
          status: 'pending'
        }
      ]
    });

    const plan = buildTodayPlan(tiedState);

    expect(plan.visiblePriorityTasks.map((task) => task.title)).toEqual([
      'Higher urgency medium task',
      'Lower urgency medium task'
    ]);
  });

  it('keeps high-energy tasks first when the user selects medium and Paceframe is deciding the order', () => {
    const mediumSelectedState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'medium',
        needsEnergyConfirmation: false,
        workOrderingPreference: 'paceframe'
      }
    });

    const plan = buildTodayPlan(mediumSelectedState);

    expect(plan.visiblePriorityTasks.map((task) => task.energyCost)).toEqual(['high', 'medium']);
    expect(plan.activeEnergyLane).toBe('high');
  });

  it('allows an explicit user override to put medium-energy work first', () => {
    const manualPreferenceState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'medium',
        needsEnergyConfirmation: false,
        workOrderingPreference: 'medium'
      }
    });

    const plan = buildTodayPlan(manualPreferenceState);

    expect(plan.visiblePriorityTasks.map((task) => task.energyCost)).toEqual(['medium', 'high']);
    expect(plan.activeEnergyLane).toBe('medium');
  });

  it('detects elevated burnout risk from stress, screen fatigue, and sleep loss', () => {
    const signal = getBurnoutSignal({
      ...mockDashboard.energyState,
      stressLevel: 9,
      screenFatigue: 9,
      sleepQuality: 4
    });

    expect(signal.level).toBe('high');
  });

  it('updates completion metrics when a task is completed', () => {
    const tasks = completeTask(mockDashboard.tasks, 'task-3');
    const summary = buildWeeklySummary({
      ...mockDashboard,
      tasks
    });

    expect(summary.completedTasks).toBe(2);
    expect(summary.completionRate).toBe(67);
  });

  it('calculates care consistency from all care anchors', () => {
    expect(calculateCareConsistency(mockDashboard.carePlan)).toBe(26);
  });

  it('builds a contextual AI coach response for energy confirmation days', () => {
    const coach = buildAICoachCard(mockDashboard);

    expect(coach.title.toLowerCase()).toContain('ai coach');
    expect(coach.nextAction.toLowerCase()).toContain('plan tab');
  });

  it('supports different default task durations by energy lane', () => {
    expect(
      createTask({
        title: 'High energy task',
        urgency: 8,
        importance: 9,
        energyCost: 'high',
        estimatedMinutes: 90
      }).estimatedMinutes
    ).toBe(90);

    expect(
      createTask({
        title: 'Medium energy task',
        urgency: 7,
        importance: 7,
        energyCost: 'medium',
        estimatedMinutes: 45
      }).estimatedMinutes
    ).toBe(45);
  });

  it('merges older saved dashboard data with current defaults', () => {
    const merged = mergeDashboardState({
      energyState: {
        focusLabel: 'Old saved state',
        energy: 'low',
        sleepQuality: 5,
        stressLevel: 8,
        screenFatigue: 7,
        movementMinutes: 0
      },
      tasks: [
        {
          id: 'legacy-high',
          title: 'Legacy captured high task',
          urgency: 7,
          importance: 7,
          energyCost: 'high',
          estimatedMinutes: 45,
          status: 'pending'
        },
        {
          id: 'legacy-low',
          title: 'Legacy captured low task',
          urgency: 7,
          importance: 7,
          energyCost: 'low',
          estimatedMinutes: 45,
          status: 'pending'
        }
      ],
      checkIn: {
        mood: 4,
        stressLevel: 8,
        sleepQuality: 5,
        screenFatigue: 7,
        wins: [],
        supportNeeded: 'Need lighter work'
      }
    });

    expect(merged.carePlan.hydrationTarget).toBe(mockDashboard.carePlan.hydrationTarget);
    expect(merged.reflection.intention).toBe(mockDashboard.reflection.intention);
    expect(merged.taskFlow.needsEnergyConfirmation).toBe(true);
    expect(merged.taskFlow.workOrderingPreference).toBe('paceframe');
    expect(merged.tasks[0]?.estimatedMinutes).toBe(90);
    expect(merged.tasks[1]?.estimatedMinutes).toBe(20);
    expect(merged.energyState.focusLabel).toBe('Old saved state');
  });

  it('supplies the 8:00 AM wake-time default for legacy profiles', () => {
    const { wakeTime: _legacyWakeTime, ...legacyProfile } = mockDashboard.profile;
    const merged = mergeDashboardState({
      profile: legacyProfile as DashboardState['profile']
    });

    expect(merged.profile.wakeTime).toBe('08:00');
  });
});
