import { describe, expect, it } from 'vitest';
import {
  buildAICoachCard,
  buildTodayPlan,
  buildWeeklySummary,
  calculateCareConsistency,
  completeTask,
  getBurnoutSignal,
  mergeDashboardState,
  mockDashboard
} from './index';

describe('planning engine', () => {
  it('requires energy confirmation on moderate burnout days before revealing a lead task', () => {
    const plan = buildTodayPlan(mockDashboard);

    expect(plan.needsEnergyConfirmation).toBe(true);
    expect(plan.leadTask).toBeNull();
    expect(plan.visiblePriorityTasks).toHaveLength(0);
    expect(plan.prioritizedTasks.length).toBeGreaterThan(0);
    expect(plan.essentials.length).toBeGreaterThan(1);
  });

  it('skips energy confirmation on high burnout days and keeps the protective ranking visible', () => {
    const highBurnoutState = mergeDashboardState({
      energyState: {
        ...mockDashboard.energyState,
        stressLevel: 9,
        screenFatigue: 9,
        sleepQuality: 4
      },
      taskFlow: {
        selectedEnergyLane: null,
        needsEnergyConfirmation: true
      }
    });

    const plan = buildTodayPlan(highBurnoutState);

    expect(plan.needsEnergyConfirmation).toBe(false);
    expect(plan.leadTask?.title).toBe('Refine onboarding copy');
    expect(plan.visiblePriorityTasks[0]?.title).toBe('Refine onboarding copy');
  });

  it('filters the visible priority stack to the selected energy lane', () => {
    const laneSelectedState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'high',
        needsEnergyConfirmation: false
      }
    });

    const plan = buildTodayPlan(laneSelectedState);

    expect(plan.needsEnergyConfirmation).toBe(false);
    expect(plan.activeEnergyLane).toBe('high');
    expect(plan.leadTask?.title).toBe('Prepare investor update');
    expect(plan.visiblePriorityTasks.every((task) => task.energyCost === 'high')).toBe(true);
  });

  it('falls back to the nearest lane when the selected lane has no matching tasks', () => {
    const fallbackState = mergeDashboardState({
      taskFlow: {
        selectedEnergyLane: 'low',
        needsEnergyConfirmation: false
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
    expect(plan.visiblePriorityTasks).toHaveLength(1);
    expect(plan.visiblePriorityTasks[0]?.title).toBe('Refine launch copy');
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
      tasks: [],
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
    expect(merged.energyState.focusLabel).toBe('Old saved state');
  });
});
