import { describe, expect, it } from 'vitest';
import { buildAICoachCard, buildTodayPlan, buildWeeklySummary, calculateCareConsistency, completeTask, getBurnoutSignal, mergeDashboardState, mockDashboard } from './index';

describe('planning engine', () => {
  it('prioritizes lower-energy work when stress is high', () => {
    const plan = buildTodayPlan(mockDashboard);

    expect(plan.prioritizedTasks[0]?.title).toBe('Refine onboarding copy');
    expect(plan.essentials.length).toBeGreaterThan(1);
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

  it('builds a contextual AI coach response', () => {
    const coach = buildAICoachCard(mockDashboard);

    expect(coach.title.toLowerCase()).toContain('ai coach');
    expect(coach.nextAction.length).toBeGreaterThan(10);
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
    expect(merged.energyState.focusLabel).toBe('Old saved state');
  });
});
