import {
  createAIMemoryContext,
  listReviewArtifacts,
  normalizeAIMemoryError,
  reviewQuerySchema,
  reviewWriteSchema,
  upsertReviewArtifact
} from '../../../../src/lib/ai-memory';

export async function GET(request: Request) {
  try {
    const query = reviewQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await listReviewArtifacts(supabase, claims.userId, query);

    return Response.json({ data });
  } catch (error) {
    const normalized = normalizeAIMemoryError(error);
    return Response.json({ error: normalized.message }, { status: normalized.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = reviewWriteSchema.parse(await request.json());
    const { supabase, claims } = createAIMemoryContext(request);
    const data = await upsertReviewArtifact(supabase, claims, body);

    return Response.json({ data });
  } catch (error) {
    const normalized = normalizeAIMemoryError(error);
    return Response.json({ error: normalized.message }, { status: normalized.status });
  }
}
