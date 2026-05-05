import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { DashboardState, LiveAssistantReply, LiveCoachingBundle } from '@paceframe/shared';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  ai?: {
    baseUrl?: string;
  };
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, '');
}

function extractHost(raw?: string | null) {
  if (!raw) {
    return '';
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('exp://')) {
      return new URL(trimmed).hostname;
    }
  } catch {
    return '';
  }

  const withoutScheme = trimmed.replace(/^[a-z]+:\/\//i, '');
  const hostPort = withoutScheme.split('/')[0] ?? '';
  return hostPort.split(':')[0] ?? '';
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function buildPortUrls(hosts: string[], ports: number[]) {
  return hosts.flatMap((host) => ports.map((port) => `http://${host}:${port}`));
}

function getExpoHostCandidates() {
  const configHost = extractHost((Constants.expoConfig as { hostUri?: string } | null)?.hostUri);
  const linkingHost = extractHost(Constants.linkingUri);

  return unique([configHost, linkingHost]);
}

export function getAICoachingBaseUrls() {
  const explicit = process.env.EXPO_PUBLIC_AI_API_URL ?? extra.ai?.baseUrl ?? '';
  const expoHosts = getExpoHostCandidates();
  const explicitBaseUrl = explicit ? normalizeBaseUrl(explicit) : '';

  if (Platform.OS === 'android') {
    const fallbacks = unique([
      ...buildPortUrls(expoHosts, [3000, 3001, 3002]),
      'http://10.0.2.2:3000',
      'http://10.0.2.2:3001',
      'http://10.0.2.2:3002'
    ]);

    return explicitBaseUrl ? unique([explicitBaseUrl, ...fallbacks]) : fallbacks;
  }
  

  const fallbacks = unique([
    ...buildPortUrls(expoHosts, [3000, 3001, 3002]),
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  ]);

  return explicitBaseUrl ? unique([explicitBaseUrl, ...fallbacks]) : fallbacks;
}

function toAIAvailabilityError(error: unknown, attemptedBaseUrls: string[], fallbackMessage: string) {
  if (error instanceof Error) {
    if (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) {
      return new Error(error.message);
    }

    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      return new Error(
        `Paceframe AI could not reach ${attemptedBaseUrls.join(' or ')}. Keep \`npm run dev:web\` running, and if you are on a real device set EXPO_PUBLIC_AI_API_URL to your Mac's local IP before restarting Expo.`
      );
    }

    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}

class AIHttpError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AIHttpError';
    this.status = status;
  }
}

type AssistantHistoryEntry = {
  role: 'user' | 'assistant';
  text: string;
  meta?: string;
};

export async function fetchLiveCoaching(dashboard: DashboardState, userEmail?: string | null) {
  const baseUrls = getAICoachingBaseUrls();

  try {
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/ai/coach`, {
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
          throw new AIHttpError(payload?.error ?? 'Live AI coaching is not available right now.', response.status);
        }

        return payload.data;
      } catch (error) {
        if (error instanceof AIHttpError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error('Live AI coaching is not available right now.');
      }
    }

    throw lastError ?? new Error('Live AI coaching is not available right now.');
  } catch (error) {
    throw toAIAvailabilityError(error, baseUrls, 'Live AI coaching is not available right now.');
  }
}

export async function fetchLiveAssistantReply(
  dashboard: DashboardState,
  question: string,
  userEmail?: string | null,
  history: AssistantHistoryEntry[] = []
) {
  const baseUrls = getAICoachingBaseUrls();

  try {
    let lastError: Error | null = null;

    for (const baseUrl of baseUrls) {
      try {
        const response = await fetch(`${baseUrl}/api/ai/assist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            dashboard,
            question,
            userEmail: userEmail ?? null,
            history
          })
        });

        const payload = await response.json().catch(() => null) as { error?: string; data?: LiveAssistantReply } | null;

        if (!response.ok || !payload?.data) {
          throw new AIHttpError(payload?.error ?? 'Paceframe AI could not answer right now.', response.status);
        }

        return payload.data;
      } catch (error) {
        if (error instanceof AIHttpError) {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error('Paceframe AI could not answer right now.');
      }
    }

    throw lastError ?? new Error('Paceframe AI could not answer right now.');
  } catch (error) {
    throw toAIAvailabilityError(error, baseUrls, 'Paceframe AI could not answer right now.');
  }
}
