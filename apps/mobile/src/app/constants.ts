import type { CrashWindow, EnergyLevel, PlanningStyle } from '@paceframe/shared';
import type { Tab } from './types';

export const STORAGE_KEY = 'paceframe-dashboard-v1';

export const tabs: Array<{ key: Tab; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'plan', label: 'Plan' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'reset', label: 'Reset' },
  { key: 'account', label: 'Account' }
];

export const energyLevels: EnergyLevel[] = ['low', 'medium', 'high'];
export const planningStyles: PlanningStyle[] = ['steady', 'protective', 'ambitious'];
export const crashWindows: CrashWindow[] = ['morning', 'afternoon', 'evening'];
