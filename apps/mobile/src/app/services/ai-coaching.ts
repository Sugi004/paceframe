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

const AI_MEMORY_BACKOFF_MS = 5 * 60_000;
let aiMemoryBackoffUntil = 0;

function shouldSkipAIMemoryRequests() {
  return Date.now() < aiMemoryBackoffUntil;
}

function isOptionalAIMemoryFailure(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('ai memory tables are not ready') ||
    normalized.includes('schema cache') ||
    normalized.includes('public.ai_') ||
    normalized.includes('row-level security') ||
    normalized.includes('could not verify access') ||
    normalized.includes('authorization bearer token is required')
  );
}

function markAIMemoryBackoff() {
  aiMemoryBackoffUntil = Date.now() + AI_MEMORY_BACKOFF_MS;
}

type AssistantHistoryEntry = {
  role: 'user' | 'assistant';
  text: string;
  meta?: string;
};

export type PersistedAssistantThread = {
  conversationId: string;
  title: string | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    text: string;
    meta?: string;
  }>;
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

async function authedFetch(path: string, authToken: string, init?: RequestInit) {
  const [baseUrl] = getAICoachingBaseUrls();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...(init?.headers ?? {})
    }
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'AI persistence request failed.';
    throw new Error(message);
  }

  return payload as { data?: unknown };
}

export async function fetchLatestAssistantThread(authToken: string): Promise<PersistedAssistantThread | null> {
  if (shouldSkipAIMemoryRequests()) {
    return null;
  }

  let summaryPayload: Awaited<ReturnType<typeof authedFetch>>;
  try {
    summaryPayload = await authedFetch('/api/ai/history?limit=1', authToken);
  } catch (error) {
    if (error instanceof Error && isOptionalAIMemoryFailure(error.message)) {
      markAIMemoryBackoff();
      return null;
    }

    throw error;
  }
  const summaryData =
    summaryPayload.data && typeof summaryPayload.data === 'object' && 'conversations' in summaryPayload.data
      ? (summaryPayload.data as { conversations?: Array<{ id: string }> }).conversations
      : [];
  const latestConversation = summaryData?.[0];

  if (!latestConversation?.id) {
    return null;
  }

  let threadPayload: Awaited<ReturnType<typeof authedFetch>>;
  try {
    threadPayload = await authedFetch(`/api/ai/history?conversationId=${latestConversation.id}`, authToken);
  } catch (error) {
    if (error instanceof Error && isOptionalAIMemoryFailure(error.message)) {
      markAIMemoryBackoff();
      return null;
    }

    throw error;
  }
  const threadData = threadPayload.data as
    | {
        conversation?: {
          id: string;
          title: string | null;
        };
        messages?: Array<{
          id: string;
          role: 'system' | 'user' | 'assistant';
          content: string;
          metadata?: Record<string, unknown>;
        }>;
      }
    | undefined;

  if (!threadData?.conversation?.id) {
    return null;
  }

  return {
    conversationId: threadData.conversation.id,
    title: threadData.conversation.title ?? null,
    messages:
      threadData.messages
        ?.filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({
          id: message.id,
          role: message.role as 'user' | 'assistant',
          text: message.content,
          meta: typeof message.metadata?.meta === 'string' ? message.metadata.meta : undefined
        })) ?? []
  };
}

export async function persistAssistantConversation(params: {
  authToken: string;
  conversationId?: string | null;
  title?: string;
  messages: Array<{
    role: 'user' | 'assistant';
    text: string;
    meta?: string;
  }>;
}) {
  if (shouldSkipAIMemoryRequests()) {
    return params.conversationId ?? null;
  }

  let payload: Awaited<ReturnType<typeof authedFetch>>;
  try {
    payload = await authedFetch('/api/ai/history', params.authToken, {
      method: 'POST',
      body: JSON.stringify({
        conversationId: params.conversationId ?? undefined,
        title: params.title,
        source: 'assist',
        messages: params.messages.map((message) => ({
          role: message.role,
          content: message.text,
          metadata: message.meta ? { meta: message.meta } : undefined
        }))
      })
    });
  } catch (error) {
    if (error instanceof Error && isOptionalAIMemoryFailure(error.message)) {
      markAIMemoryBackoff();
      return params.conversationId ?? null;
    }

    throw error;
  }

  const data = payload.data as
    | {
        conversation?: {
          id: string;
        };
      }
    | undefined;

  return data?.conversation?.id ?? null;
}

export async function persistReviewArtifacts(params: {
  authToken: string;
  daily: {
    headline: string;
    summary: string;
    payload?: Record<string, unknown>;
    model?: string;
  };
  weekly: {
    headline: string;
    summary: string;
    payload?: Record<string, unknown>;
    model?: string;
  };
}) {
  if (shouldSkipAIMemoryRequests()) {
    return;
  }

  try {
    await Promise.all([
      authedFetch('/api/ai/review', params.authToken, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'daily',
          headline: params.daily.headline,
          summary: params.daily.summary,
          payload: params.daily.payload,
          model: params.daily.model,
          source: 'coach'
        })
      }),
      authedFetch('/api/ai/review', params.authToken, {
        method: 'POST',
        body: JSON.stringify({
          kind: 'weekly',
          headline: params.weekly.headline,
          summary: params.weekly.summary,
          payload: params.weekly.payload,
          model: params.weekly.model,
          source: 'coach'
        })
      })
    ]);
  } catch (error) {
    if (error instanceof Error && isOptionalAIMemoryFailure(error.message)) {
      markAIMemoryBackoff();
      return;
    }

    throw error;
  }
}
