import { z } from 'zod';
import {
  buildTodayPlan,
  getBurnoutSignal,
  mergeDashboardState,
  type DashboardState
} from '@paceframe/shared';
import {
  assistJsonSchema,
  assistResponseSchema,
  generateStructuredAI,
  getGeminiModel,
  getGroqModel,
  normalizeAIError
} from '../../../../src/lib/gemini';

const requestSchema = z.object({
  dashboard: z.unknown(),
  question: z.string().trim().min(1),
  userEmail: z.string().email().nullable().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        text: z.string().trim().min(1),
        meta: z.string().trim().optional()
      })
    )
    .max(8)
    .optional()
});

function buildAssistantPrompt(
  dashboard: DashboardState,
  question: string,
  userEmail?: string | null,
  history?: Array<{ role: 'user' | 'assistant'; text: string; meta?: string }>
) {
  const plan = buildTodayPlan(dashboard);
  const burnout = getBurnoutSignal(dashboard.energyState);
  const topTask = plan.prioritizedTasks[0];
  const conversation = history?.length
    ? history
        .map((entry, index) => `${index + 1}. ${entry.role === 'user' ? 'User' : 'Paceframe AI'}: ${entry.text}${entry.meta ? ` | ${entry.meta}` : ''}`)
        .join('\n')
    : 'No prior conversation.';

  return [
    'You are Paceframe, a calm but genuinely interactive AI day coach.',
    'You are in an ongoing chat, not a one-shot summary box.',
    'Answer the user’s latest question directly in the first sentence, then personalize the rest using their current state and the recent conversation.',
    'Do not reuse stock phrasing. Vary your wording naturally from one question to the next.',
    'Do not diagnose, moralize, or sound robotic.',
    'If the user asks for a plan, sequence the day step by step.',
    'If the user asks whether to push harder, give a clear yes/no recommendation with conditions.',
    'If the user is vague or overwhelmed, reduce cognitive load and ask one useful follow-up question.',
    'Keep the tone supportive, specific, and human.',
    '',
    `User email: ${userEmail ?? 'unknown'}`,
    `Latest question: ${question}`,
    '',
    'Recent conversation:',
    conversation,
    '',
    `Planning style: ${dashboard.profile.planningStyle}`,
    `Crash window: ${dashboard.profile.crashWindow}`,
    `Primary goal: ${dashboard.profile.primaryGoal || 'not provided'}`,
    `Energy: ${dashboard.energyState.energy}`,
    `Focus label: ${dashboard.energyState.focusLabel}`,
    `Sleep quality: ${dashboard.energyState.sleepQuality}/10`,
    `Stress: ${dashboard.energyState.stressLevel}/10`,
    `Screen fatigue: ${dashboard.energyState.screenFatigue}/10`,
    `Burnout risk: ${burnout.level} (${burnout.score}/100)`,
    `Burnout summary: ${burnout.summary}`,
    `Top task: ${topTask ? `${topTask.title} (${topTask.energyCost} energy, ${topTask.estimatedMinutes} min)` : 'none'}`,
    `Recovery blocks: ${plan.recoveryBlocks.map((item) => `${item.label} @ ${item.window}`).join(' | ') || 'none'}`,
    `Essentials: ${plan.essentials.join(' | ') || 'none'}`,
    `Meals: ${dashboard.carePlan.mealsDone}/${dashboard.carePlan.mealsTarget}`,
    `Water: ${dashboard.carePlan.hydrationDone}/${dashboard.carePlan.hydrationTarget}`,
    `Movement: ${dashboard.carePlan.movementDone}/${dashboard.carePlan.movementTarget}`,
    `Rest: ${dashboard.carePlan.restDone}/${dashboard.carePlan.restTarget}`,
    `Intention: ${dashboard.reflection.intention || 'none'}`,
    `Evening note: ${dashboard.reflection.eveningNote || 'none'}`,
    '',
    'Return:',
    '- headline: short and specific to this exact question',
    '- answer: 2-4 sentences that directly answer the latest question',
    '- planSteps: 2-4 concrete next steps tailored to the current state',
    '- suggestedAction: one immediate next move in imperative voice',
    '- supportiveNote: one supportive sentence that lowers pressure without becoming generic',
    '- followUpQuestion: one natural follow-up question to continue the conversation'
  ].join('\n');
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const dashboard = mergeDashboardState(body.dashboard as Partial<DashboardState>);
    const geminiModel = getGeminiModel('GEMINI_ASSIST_MODEL', getGeminiModel('GEMINI_COACH_MODEL', 'gemini-2.0-flash'));
    const groqModel = getGroqModel('GROQ_ASSIST_MODEL', getGroqModel('GROQ_COACH_MODEL', 'openai/gpt-oss-20b'));

    const response = await generateStructuredAI({
      geminiModel,
      groqModel,
      prompt: buildAssistantPrompt(dashboard, body.question, body.userEmail, body.history),
      schema: assistResponseSchema,
      responseSchema: assistJsonSchema,
      schemaName: 'paceframe_assistant_reply'
    });

    return Response.json({
      data: {
        ...response.data,
        generatedAt: new Date().toISOString(),
        model: `${response.provider}:${response.model}`
      }
    });
  } catch (error) {
    const normalized = normalizeAIError(error);
    return Response.json({ error: normalized.message }, { status: normalized.status });
  }
}
