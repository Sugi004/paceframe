import {
  appendConversationHistory,
  createAIMemoryContext,
  historyQuerySchema,
  historyWriteSchema,
  listConversationHistory,
  normalizeAIMemoryError
} from '../../../../src/lib/ai-memory';
import { logRouteOutcome } from '../../../../src/lib/request-log';

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const query = historyQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await listConversationHistory(supabase, claims.userId, query);
    const response = Response.json({ data });
    const count = 'messages' in data ? data.messages.length : 'conversations' in data ? data.conversations.length : undefined;
    logRouteOutcome({
      route: '/api/ai/history',
      method: 'GET',
      status: response.status,
      durationMs: Date.now() - startedAt,
      meta: count === undefined ? undefined : { count }
    });
    return response;
  } catch (error) {
    const normalized = normalizeAIMemoryError(error);
    const response = Response.json({ error: normalized.message }, { status: normalized.status });
    logRouteOutcome({
      route: '/api/ai/history',
      method: 'GET',
      status: response.status,
      durationMs: Date.now() - startedAt,
      meta: {
        error: normalized.message
      }
    });
    return response;
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  try {
    const body = historyWriteSchema.parse(await request.json());
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await appendConversationHistory(supabase, claims, body);
    const response = Response.json({ data });
    logRouteOutcome({
      route: '/api/ai/history',
      method: 'POST',
      status: response.status,
      durationMs: Date.now() - startedAt,
      meta: {
        action: 'append'
      }
    });
    return response;
  } catch (error) {
    const normalized = normalizeAIMemoryError(error);
    const response = Response.json({ error: normalized.message }, { status: normalized.status });
    logRouteOutcome({
      route: '/api/ai/history',
      method: 'POST',
      status: response.status,
      durationMs: Date.now() - startedAt,
      meta: {
        error: normalized.message
      }
    });
    return response;
  }
}
