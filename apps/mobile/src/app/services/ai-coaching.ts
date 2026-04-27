import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { DashboardState, LiveCoachingBundle } from '@paceframe/shared';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  ai?: {
    baseUrl?: string;
  };
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

export function getAICoachingBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_AI_API_URL ?? extra.ai?.baseUrl ?? '';
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export async function fetchLiveCoaching(dashboard: DashboardState, userEmail?: string | null) {
  const response = await fetch(`${getAICoachingBaseUrl()}/api/ai/coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dashboard,
      userEmail: userEmail ?? null
    })
  });

  const payload = await response.json().catch(() => null) as { error?: string; data?: LiveCoachingBundle } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error ?? 'Live AI coaching is not available right now.');
  }

  return payload.data;
}
