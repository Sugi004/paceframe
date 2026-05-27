import { GoogleGenAI } from '@google/genai';
import { z, type ZodType } from 'zod';
import { getServerEnvValue } from './server-env';

export function getGeminiApiKey() {
  return getServerEnvValue('GEMINI_API_KEY') || getServerEnvValue('GOOGLE_API_KEY');
}

export function getGeminiModel(key: string, fallback: string) {
  return getServerEnvValue(key) || fallback;
}

export function getGroqApiKey() {
  return getServerEnvValue('GROQ_API_KEY');
}

export function getGroqModel(key: string, fallback: string) {
  return getServerEnvValue(key) || fallback;
}

export function createGeminiClient() {
  const apiKey = getGeminiApiKey();
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

export function normalizeGeminiError(error: unknown) {
  const fallback = {
    status: 500,
    message: 'Live Gemini assistance failed.'
  };

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;

  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('Quota exceeded')) {
    const retryMatch = message.match(/retry in ([\\d.]+)s/i);
    const retrySuffix = retryMatch ? ` Try again in about ${Math.ceil(Number(retryMatch[1]))} seconds.` : '';

    return {
      status: 429,
      message: `Gemini quota is exhausted for this API project. The key is connected, but the project has no available AI quota right now.${retrySuffix}`
    };
  }

  if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
    return {
      status: 401,
      message: 'The Gemini API key is invalid for this project. Update GEMINI_API_KEY in the root .env file and restart the web server.'
    };
  }

  return {
    status: 500,
    message: 'Gemini could not complete that request right now.'
  };
}

export function normalizeGroqError(error: unknown) {
  const fallback = {
    status: 500,
    message: 'Live Groq assistance failed.'
  };

  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message;

  if (message.includes('401') || message.toLowerCase().includes('invalid api key')) {
    return {
      status: 401,
      message: 'The Groq API key is invalid for this project. Update GROQ_API_KEY in the root .env file and restart the web server.'
    };
  }

  if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
    return {
      status: 429,
      message: 'Groq rate limits are currently exhausted for this project. Try again shortly or switch to a project with available quota.'
    };
  }

  return {
    status: 500,
    message: 'Groq could not complete that request right now.'
  };
}

export function normalizeAIError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('Gemini quota')) {
      return { status: 429, message: error.message };
    }

    if (error.message.includes('Groq rate limits')) {
      return { status: 429, message: error.message };
    }

    if (error.message.includes('invalid') && error.message.includes('API key')) {
      return { status: 401, message: error.message };
    }

    if (error.message.includes('No AI provider is configured')) {
      return { status: 500, message: error.message };
    }

    return { status: 500, message: 'Live AI assistance is temporarily unavailable.' };
  }

  return {
    status: 500,
    message: 'Live AI assistance failed.'
  };
}

export async function generateStructuredGemini<T>({
  model,
  prompt,
  schema,
  responseSchema
}: {
  model: string;
  prompt: string;
  schema: ZodType<T>;
  responseSchema: Record<string, unknown>;
}) {
  const client = createGeminiClient();

  if (!client) {
    throw new Error('GEMINI_API_KEY is missing on the web server. Add it to the root .env file before using live Gemini assistance.');
  }

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: responseSchema
    }
  });

  const text = typeof response.text === 'string' ? response.text.trim() : '';
  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error('Gemini did not return valid JSON.');
  }

  return schema.parse(parsedJson);
}

export async function generateStructuredGroq<T>({
  model,
  prompt,
  schema,
  responseSchema,
  schemaName
}: {
  model: string;
  prompt: string;
  schema: ZodType<T>;
  responseSchema: Record<string, unknown>;
  schemaName: string;
}) {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing on the web server. Add it to the root .env file before using Groq fallback assistance.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nReturn only valid JSON that matches the requested schema exactly.`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schemaName,
          schema: responseSchema
        }
      }
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        error?: {
          message?: string;
        };
        choices?: Array<{
          message?: {
            content?: string | null;
          };
        }>;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error?.message ? `${response.status} ${payload.error.message}` : `Groq request failed with status ${response.status}.`);
  }

  const text = payload?.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    throw new Error('Groq returned an empty response.');
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(text);
  } catch {
    throw new Error('Groq did not return valid JSON.');
  }

  return schema.parse(parsedJson);
}

export async function generateStructuredAI<T>({
  geminiModel,
  groqModel,
  prompt,
  schema,
  responseSchema,
  schemaName
}: {
  geminiModel: string;
  groqModel: string;
  prompt: string;
  schema: ZodType<T>;
  responseSchema: Record<string, unknown>;
  schemaName: string;
}) {
  const geminiConfigured = Boolean(getGeminiApiKey());
  const groqConfigured = Boolean(getGroqApiKey());
  const errors: Array<{ provider: 'gemini' | 'groq'; message: string; status: number }> = [];

  if (geminiConfigured) {
    try {
      const data = await generateStructuredGemini({
        model: geminiModel,
        prompt,
        schema,
        responseSchema
      });

      return {
        provider: 'gemini' as const,
        model: geminiModel,
        data
      };
    } catch (error) {
      const normalized = normalizeGeminiError(error);
      errors.push({ provider: 'gemini', message: normalized.message, status: normalized.status });
    }
  }

  if (groqConfigured) {
    try {
      const data = await generateStructuredGroq({
        model: groqModel,
        prompt,
        schema,
        responseSchema,
        schemaName
      });

      return {
        provider: 'groq' as const,
        model: groqModel,
        data
      };
    } catch (error) {
      const normalized = normalizeGroqError(error);
      errors.push({ provider: 'groq', message: normalized.message, status: normalized.status });
    }
  }

  if (!geminiConfigured && !groqConfigured) {
    throw new Error('No AI provider is configured. Add GEMINI_API_KEY or GROQ_API_KEY to the root .env file and restart the web server.');
  }

  const quotaError = errors.find((item) => item.status === 429);
  const highestPriorityError = quotaError ?? errors[0];
  throw new Error(
    errors.length > 1
      ? `${highestPriorityError.message} Groq fallback also failed.`
      : highestPriorityError.message
  );
}

export function getAIProviderStatus() {
  const geminiApiKey = getGeminiApiKey();
  const groqApiKey = getGroqApiKey();
  const geminiCoachModel = getGeminiModel('GEMINI_COACH_MODEL', 'gemini-2.0-flash');
  const groqCoachModel = getGroqModel('GROQ_COACH_MODEL', 'openai/gpt-oss-20b');

  return {
    primaryProvider: 'gemini',
    fallbackProvider: groqApiKey ? 'groq' : null,
    configured: Boolean(geminiApiKey || groqApiKey),
    gemini: {
      configured: Boolean(geminiApiKey),
      coachModel: geminiCoachModel,
      assistModel: getGeminiModel('GEMINI_ASSIST_MODEL', geminiCoachModel),
      keyHint: geminiApiKey ? `present(len=${geminiApiKey.length})` : 'missing'
    },
    groq: {
      configured: Boolean(groqApiKey),
      coachModel: groqCoachModel,
      assistModel: getGroqModel('GROQ_ASSIST_MODEL', groqCoachModel),
      keyHint: groqApiKey ? `present(len=${groqApiKey.length})` : 'missing'
    },
    clientReady: Boolean(createGeminiClient() || groqApiKey)
  };
}

export const coachJsonSchema = {
  type: 'object',
  properties: {
    aiCoach: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
        nextAction: { type: 'string' },
        protectBoundary: { type: 'string' }
      },
      required: ['title', 'message', 'nextAction', 'protectBoundary']
    },
    dailyBrief: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        focusBlock: { type: 'string' },
        recoveryAnchor: { type: 'string' }
      },
      required: ['headline', 'focusBlock', 'recoveryAnchor']
    },
    weeklyInsight: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        experiment: { type: 'string' }
      },
      required: ['title', 'summary', 'experiment']
    },
    reasoningSummary: { type: 'string' }
  },
  required: ['aiCoach', 'dailyBrief', 'weeklyInsight', 'reasoningSummary']
} as const;

export const coachResponseSchema = z.object({
  aiCoach: z.object({
    title: z.string(),
    message: z.string(),
    nextAction: z.string(),
    protectBoundary: z.string()
  }),
  dailyBrief: z.object({
    headline: z.string(),
    focusBlock: z.string(),
    recoveryAnchor: z.string()
  }),
  weeklyInsight: z.object({
    title: z.string(),
    summary: z.string(),
    experiment: z.string()
  }),
  reasoningSummary: z.string()
});

export const assistJsonSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    answer: { type: 'string' },
    planSteps: {
      type: 'array',
      items: { type: 'string' }
    },
    suggestedAction: { type: 'string' },
    supportiveNote: { type: 'string' },
    followUpQuestion: { type: 'string' }
  },
  required: ['headline', 'answer', 'planSteps', 'suggestedAction', 'supportiveNote', 'followUpQuestion']
} as const;

export const assistResponseSchema = z.object({
  headline: z.string(),
  answer: z.string(),
  planSteps: z.array(z.string()),
  suggestedAction: z.string(),
  supportiveNote: z.string(),
  followUpQuestion: z.string()
});
