import { getAIProviderStatus } from '../../../../src/lib/gemini';
import { logRouteOutcome } from '../../../../src/lib/request-log';

export async function GET() {
  const startedAt = Date.now();
  const payload = getAIProviderStatus();
  const response = Response.json(payload);

  logRouteOutcome({
    route: '/api/ai/status',
    method: 'GET',
    status: response.status,
    durationMs: Date.now() - startedAt,
    meta: {
      configured: payload.configured,
      geminiConfigured: payload.gemini.configured,
      groqConfigured: payload.groq.configured
    }
  });

  return response;
}
