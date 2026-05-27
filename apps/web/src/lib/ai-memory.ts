import { Buffer } from 'node:buffer';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getServerEnvValue } from './server-env';

const jsonObjectSchema = z.record(z.string(), z.unknown());

export const historyMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().trim().min(1).max(8000),
  metadata: jsonObjectSchema.optional(),
  createdAt: z.string().datetime().optional()
});

export const historyWriteSchema = z.object({
  conversationId: z.string().uuid().optional(),
  title: z.string().trim().max(160).optional(),
  source: z.string().trim().max(40).optional(),
  messages: z.array(historyMessageSchema).min(1).max(20)
});

export const historyQuerySchema = z.object({
  conversationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
});

export const reviewWriteSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('daily'),
    reviewDate: z.string().date().optional(),
    headline: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(8000),
    payload: jsonObjectSchema.optional(),
    model: z.string().trim().max(120).optional(),
    source: z.string().trim().max(40).optional()
  }),
  z.object({
    kind: z.literal('weekly'),
    weekStart: z.string().date().optional(),
    headline: z.string().trim().min(1).max(160),
    summary: z.string().trim().min(1).max(8000),
    payload: jsonObjectSchema.optional(),
    model: z.string().trim().max(120).optional(),
    source: z.string().trim().max(40).optional()
  })
]);

export const reviewQuerySchema = z.object({
  kind: z.enum(['daily', 'weekly', 'all']).default('all'),
  reviewDate: z.string().date().optional(),
  weekStart: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(30).default(10)
});

type HistoryWriteInput = z.infer<typeof historyWriteSchema>;
type ReviewWriteInput = z.infer<typeof reviewWriteSchema>;
type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;

export interface AuthClaims {
  userId: string;
  email?: string;
  fullName?: string;
}

interface ConversationRow {
  id: string;
  user_id: string;
  title: string | null;
  source: string;
  last_message_preview: string | null;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

function isAIMemorySetupError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('relation "public.ai_') ||
    normalized.includes("could not find the table 'public.ai_") ||
    normalized.includes('schema cache') ||
    normalized.includes('does not exist') ||
    normalized.includes('ai memory tables are not ready')
  );
}

function isAIMemoryAuthError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes('row-level security') ||
    normalized.includes('permission denied') ||
    normalized.includes('authenticated user id is missing') ||
    normalized.includes('authorization bearer token is required') ||
    normalized.includes('invalid bearer token')
  );
}

function getSupabaseUrl() {
  return getServerEnvValue('NEXT_PUBLIC_SUPABASE_URL');
}

function getSupabaseKey() {
  return getServerEnvValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || getServerEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

function truncatePreview(text: string) {
  return text.trim().replace(/\s+/g, ' ').slice(0, 180);
}

function padBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = normalized.length % 4;
  if (remainder === 0) {
    return normalized;
  }

  return normalized.padEnd(normalized.length + (4 - remainder), '=');
}

function decodeJwtClaims(token: string): AuthClaims {
  const parts = token.split('.');
  if (parts.length < 2) {
    throw new Error('Invalid bearer token.');
  }

  const payload = JSON.parse(Buffer.from(padBase64Url(parts[1]), 'base64').toString('utf8')) as Record<string, unknown>;
  const userId =
    (typeof payload.sub === 'string' && payload.sub) ||
    (typeof payload.user_id === 'string' && payload.user_id) ||
    '';

  if (!userId) {
    throw new Error('Authenticated user id is missing from the bearer token.');
  }

  return {
    userId,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    fullName: typeof payload.name === 'string' ? payload.name : undefined
  };
}

function getAuthorizationHeader(request: Request) {
  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new Error('Authorization bearer token is required.');
  }

  return authorization;
}

export function normalizeAIMemoryError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Authorization bearer token is required')) {
      return { status: 401, message: error.message };
    }

    if (error.message.includes('Authenticated user id is missing') || error.message.includes('Invalid bearer token')) {
      return { status: 401, message: error.message };
    }

    if (error.message.includes('Supabase AI memory is not configured')) {
      return { status: 500, message: error.message };
    }

    if (isAIMemorySetupError(error.message)) {
      return {
        status: 503,
        message:
          'Paceframe AI memory tables are not ready in Supabase yet. Run `supabase/migrations/0003_ai_memory.sql` in your live project, then retry.'
      };
    }

    if (isAIMemoryAuthError(error.message)) {
      return {
        status: 403,
        message:
          'Paceframe AI memory could not verify access for this user. Check Supabase third-party auth and RLS settings, then retry.'
      };
    }

    return { status: 500, message: error.message };
  }

  return {
    status: 500,
    message: 'AI memory persistence failed.'
  };
}

function assertSupabase(
  result: {
    error: {
      message: string;
      code?: string | null;
      details?: string | null;
      hint?: string | null;
    } | null;
  },
  action: string
) {
  if (result.error) {
    const suffix = [result.error.code, result.error.details, result.error.hint].filter(Boolean).join(' · ');
    throw new Error(`${action} ${result.error.message}${suffix ? ` (${suffix})` : ''}`);
  }
}

export function createAIMemoryContext(request: Request) {
  const url = getSupabaseUrl();
  const key = getSupabaseKey();

  if (!url || !key) {
    throw new Error('Supabase AI memory is not configured. Add NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key to the root .env file.');
  }

  const authorization = getAuthorizationHeader(request);
  const token = authorization.replace(/^Bearer\s+/i, '');
  const claims = decodeJwtClaims(token);

  const supabase = createClient(url, key, {
    global: {
      headers: {
        Authorization: authorization
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return {
    supabase,
    claims
  };
}

export async function ensureAIUser(client: SupabaseClient, claims: AuthClaims) {
  const result = await client.from('users').upsert(
    {
      id: claims.userId,
      email: claims.email ?? null,
      full_name: claims.fullName ?? null
    },
    {
      onConflict: 'id'
    }
  );

  assertSupabase(result, 'Could not ensure the Supabase user row.');
}

async function loadConversationThread(client: SupabaseClient, userId: string, conversationId: string) {
  const conversationResult = await client
    .from('ai_conversations')
    .select('id, user_id, title, source, last_message_preview, created_at, updated_at')
    .eq('user_id', userId)
    .eq('id', conversationId)
    .single<ConversationRow>();

  assertSupabase(conversationResult, 'Could not load the conversation.');

  const messagesResult = await client
    .from('ai_conversation_messages')
    .select('id, conversation_id, user_id, role, content, metadata, created_at')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .returns<MessageRow[]>();

  assertSupabase(messagesResult, 'Could not load conversation messages.');

  return {
    conversation: conversationResult.data,
    messages: messagesResult.data ?? []
  };
}

export async function listConversationHistory(client: SupabaseClient, userId: string, input: z.infer<typeof historyQuerySchema>) {
  if (input.conversationId) {
    return loadConversationThread(client, userId, input.conversationId);
  }

  const result = await client
    .from('ai_conversations')
    .select('id, user_id, title, source, last_message_preview, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(input.limit)
    .returns<ConversationRow[]>();

  assertSupabase(result, 'Could not list conversation history.');

  return {
    conversations: result.data ?? []
  };
}

export async function appendConversationHistory(client: SupabaseClient, claims: AuthClaims, input: HistoryWriteInput) {
  await ensureAIUser(client, claims);

  const derivedTitle =
    input.title ||
    truncatePreview(
      input.messages.find((message) => message.role === 'user')?.content ||
        input.messages[0]?.content ||
        'Paceframe chat'
    );

  let conversationId = input.conversationId;

  if (!conversationId) {
    const conversationResult = await client
      .from('ai_conversations')
      .insert({
        user_id: claims.userId,
        title: derivedTitle,
        source: input.source ?? 'assist',
        last_message_preview: truncatePreview(input.messages[input.messages.length - 1]?.content ?? '')
      })
      .select('id')
      .single<{ id: string }>();

    assertSupabase(conversationResult, 'Could not create the conversation.');
    if (!conversationResult.data?.id) {
      throw new Error('Conversation creation returned no id.');
    }

    conversationId = conversationResult.data.id;
  }

  const messageRows = input.messages.map((message) => ({
    conversation_id: conversationId,
    user_id: claims.userId,
    role: message.role,
    content: message.content,
    metadata: message.metadata ?? {},
    created_at: message.createdAt ?? new Date().toISOString()
  }));

  const insertResult = await client.from('ai_conversation_messages').insert(messageRows);
  assertSupabase(insertResult, 'Could not store conversation messages.');

  const lastMessage = input.messages[input.messages.length - 1];
  const updateResult = await client
    .from('ai_conversations')
    .update({
      title: derivedTitle,
      source: input.source ?? 'assist',
      last_message_preview: truncatePreview(lastMessage?.content ?? ''),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', claims.userId)
    .eq('id', conversationId);

  assertSupabase(updateResult, 'Could not refresh the conversation summary.');

  return loadConversationThread(client, claims.userId, conversationId);
}

function normalizeDate(value?: string) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return new Date(value).toISOString().slice(0, 10);
}

function normalizeWeekStart(value?: string) {
  const base = value ? new Date(`${value}T00:00:00.000Z`) : new Date();
  const day = base.getUTCDay() || 7;
  base.setUTCDate(base.getUTCDate() - day + 1);
  return base.toISOString().slice(0, 10);
}

export async function listReviewArtifacts(client: SupabaseClient, userId: string, input: ReviewQueryInput) {
  if (input.kind === 'daily') {
    let query = client
      .from('ai_daily_reviews')
      .select('id, user_id, review_date, headline, summary, payload, model, source, created_at, updated_at')
      .eq('user_id', userId)
      .order('review_date', { ascending: false })
      .limit(input.limit);

    if (input.reviewDate) {
      query = query.eq('review_date', input.reviewDate);
    }

    const result = await query;
    assertSupabase(result, 'Could not load daily review artifacts.');
    return { daily: result.data ?? [] };
  }

  if (input.kind === 'weekly') {
    let query = client
      .from('ai_weekly_reviews')
      .select('id, user_id, week_start, headline, summary, payload, model, source, created_at, updated_at')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(input.limit);

    if (input.weekStart) {
      query = query.eq('week_start', input.weekStart);
    }

    const result = await query;
    assertSupabase(result, 'Could not load weekly review artifacts.');
    return { weekly: result.data ?? [] };
  }

  const [dailyResult, weeklyResult] = await Promise.all([
    client
      .from('ai_daily_reviews')
      .select('id, user_id, review_date, headline, summary, payload, model, source, created_at, updated_at')
      .eq('user_id', userId)
      .order('review_date', { ascending: false })
      .limit(input.limit),
    client
      .from('ai_weekly_reviews')
      .select('id, user_id, week_start, headline, summary, payload, model, source, created_at, updated_at')
      .eq('user_id', userId)
      .order('week_start', { ascending: false })
      .limit(input.limit)
  ]);

  assertSupabase(dailyResult, 'Could not load daily review artifacts.');
  assertSupabase(weeklyResult, 'Could not load weekly review artifacts.');

  return {
    daily: dailyResult.data ?? [],
    weekly: weeklyResult.data ?? []
  };
}

export async function upsertReviewArtifact(client: SupabaseClient, claims: AuthClaims, input: ReviewWriteInput) {
  await ensureAIUser(client, claims);

  if (input.kind === 'daily') {
    const reviewDate = normalizeDate(input.reviewDate);
    const result = await client
      .from('ai_daily_reviews')
      .upsert(
        {
          user_id: claims.userId,
          review_date: reviewDate,
          headline: input.headline,
          summary: input.summary,
          payload: input.payload ?? {},
          model: input.model ?? null,
          source: input.source ?? 'coach'
        },
        {
          onConflict: 'user_id,review_date'
        }
      )
      .select('id, user_id, review_date, headline, summary, payload, model, source, created_at, updated_at')
      .single();

    assertSupabase(result, 'Could not store the daily review artifact.');
    return {
      daily: result.data
    };
  }

  const weekStart = normalizeWeekStart(input.weekStart);
  const result = await client
    .from('ai_weekly_reviews')
    .upsert(
      {
        user_id: claims.userId,
        week_start: weekStart,
        headline: input.headline,
        summary: input.summary,
        payload: input.payload ?? {},
        model: input.model ?? null,
        source: input.source ?? 'coach'
      },
      {
        onConflict: 'user_id,week_start'
      }
    )
    .select('id, user_id, week_start, headline, summary, payload, model, source, created_at, updated_at')
    .single();

  assertSupabase(result, 'Could not store the weekly review artifact.');
  return {
    weekly: result.data
  };
}
