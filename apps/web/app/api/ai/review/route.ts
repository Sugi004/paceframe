import {
  createAIMemoryContext,
  listReviewArtifacts,
  normalizeAIMemoryError,
  reviewQuerySchema,
  reviewWriteSchema,
  upsertReviewArtifact
} from '../../../../src/lib/ai-memory';
import { logRouteOutcome } from '../../../../src/lib/request-log';

export async function GET(request: Request) {
  const startedAt = Date.now();
  try {
    const query = reviewQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await listReviewArtifacts(supabase, claims.userId, query);
    const response = Response.json({ data });
    const count = Array.isArray(data.daily) ? data.daily.length : Array.isArray(data.weekly) ? data.weekly.length : undefined;
    logRouteOutcome({
      route: '/api/ai/review',
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
      route: '/api/ai/review',
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
    const body = reviewWriteSchema.parse(await request.json());
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await upsertReviewArtifact(supabase, claims, body);
    const response = Response.json({ data });
    logRouteOutcome({
      route: '/api/ai/review',
      method: 'POST',
      status: response.status,
      durationMs: Date.now() - startedAt,
      meta: {
        action: 'upsert'
      }
    });
    return response;
  } catch (error) {
    const normalized = normalizeAIMemoryError(error);
    const response = Response.json({ error: normalized.message }, { status: normalized.status });
    logRouteOutcome({
      route: '/api/ai/review',
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
