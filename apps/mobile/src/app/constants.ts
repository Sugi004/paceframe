import type { CrashWindow, EnergyLevel, PlanningStyle } from '@paceframe/shared';
import type { Tab } from './types';

export const STORAGE_KEY = 'paceframe-dashboard-v1';

export function getDashboardStorageKey(userId?: string | null) {
  return userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;
}

export const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Today' },
  { key: 'assistant', label: 'Coach' },
  { key: 'plan', label: 'Plan' },
  { key: 'checkin', label: 'Signals' },
  { key: 'reset', label: 'Recover' },
  { key: 'account', label: 'You' }
];

export const energyLevels: EnergyLevel[] = ['low', 'medium', 'high'];
export const planningStyles: PlanningStyle[] = ['steady', 'protective', 'ambitious'];
export const crashWindows: CrashWindow[] = ['morning', 'afternoon', 'evening'];
