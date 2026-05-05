import { getAIProviderStatus } from '../../../../src/lib/gemini';

export async function GET() {
  return Response.json(getAIProviderStatus());
}
