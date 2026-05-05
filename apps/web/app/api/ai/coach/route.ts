import { z } from 'zod';
import {
  buildAICoachCard,
  buildDailyBrief,
  buildTodayPlan,
  buildWeeklyInsight,
  getBurnoutSignal,
  mergeDashboardState,
  type DashboardState
} from '@paceframe/shared';
import {
  coachJsonSchema,
  coachResponseSchema,
  generateStructuredAI,
  getGeminiModel,
  getGroqModel,
  normalizeAIError
} from '../../../../src/lib/gemini';

const requestSchema = z.object({
  dashboard: z.unknown(),
  userEmail: z.string().email().nullable().optional()
});
function buildCoachingPrompt(dashboard: DashboardState, userEmail?: string | null) {
  const fallbackCoach = buildAICoachCard(dashboard);
  const fallbackBrief = buildDailyBrief(dashboard);
  const fallbackInsight = buildWeeklyInsight(dashboard);
  const plan = buildTodayPlan(dashboard);
  const burnout = getBurnoutSignal(dashboard.energyState);
  const topTask = plan.prioritizedTasks[0];

  return [
    'You are Paceframe, an AI life coach for ambitious people who need calm, practical guidance.',
    'Personalize the coaching from the structured state below.',
    'Stay concise, emotionally intelligent, practical, and non-clinical.',
    'Do not diagnose conditions or make medical claims.',
    'Respect the deterministic plan instead of inventing a different one.',
    '',
    `User email: ${userEmail ?? 'unknown'}`,
    `First name: ${dashboard.profile.firstName || 'unknown'}`,
    `Role: ${dashboard.profile.roleLabel || 'unknown'}`,
    `Primary goal: ${dashboard.profile.primaryGoal || 'not provided'}`,
    `Planning style: ${dashboard.profile.planningStyle}`,
    `Crash window: ${dashboard.profile.crashWindow}`,
    '',
    `Energy level: ${dashboard.energyState.energy}`,
    `Focus label: ${dashboard.energyState.focusLabel}`,
    `Sleep quality: ${dashboard.energyState.sleepQuality}/10`,
    `Stress: ${dashboard.energyState.stressLevel}/10`,
    `Screen fatigue: ${dashboard.energyState.screenFatigue}/10`,
    `Movement minutes: ${dashboard.energyState.movementMinutes}`,
    `Burnout risk: ${burnout.level} (${burnout.score}/100)`,
    `Burnout summary: ${burnout.summary}`,
    '',
    `Top task: ${topTask ? `${topTask.title} (${topTask.energyCost} energy, ${topTask.estimatedMinutes} min, score ${topTask.priorityScore})` : 'none'}`,
    `Recovery blocks: ${plan.recoveryBlocks.map((item) => `${item.label} @ ${item.window}`).join(' | ') || 'none'}`,
    `Essentials: ${plan.essentials.join(' | ') || 'none'}`,
    '',
    `Meals: ${dashboard.carePlan.mealsDone}/${dashboard.carePlan.mealsTarget}`,
    `Water: ${dashboard.carePlan.hydrationDone}/${dashboard.carePlan.hydrationTarget}`,
    `Movement blocks: ${dashboard.carePlan.movementDone}/${dashboard.carePlan.movementTarget}`,
    `Rest blocks: ${dashboard.carePlan.restDone}/${dashboard.carePlan.restTarget}`,
    '',
    `Intention: ${dashboard.reflection.intention || 'none'}`,
    `Evening note: ${dashboard.reflection.eveningNote || 'none'}`,
    `Gratitude: ${dashboard.reflection.gratitude || 'none'}`,
    '',
    'Deterministic fallback guidance to preserve:',
    `Fallback coach title: ${fallbackCoach.title}`,
    `Fallback coach message: ${fallbackCoach.message}`,
    `Fallback next action: ${fallbackCoach.nextAction}`,
    `Fallback boundary: ${fallbackCoach.protectBoundary}`,
    `Fallback brief headline: ${fallbackBrief.headline}`,
    `Fallback brief focus block: ${fallbackBrief.focusBlock}`,
    `Fallback brief recovery anchor: ${fallbackBrief.recoveryAnchor}`,
    `Fallback insight title: ${fallbackInsight.title}`,
    `Fallback insight summary: ${fallbackInsight.summary}`,
    `Fallback insight experiment: ${fallbackInsight.experiment}`,
    '',
    'Return improved versions of the AI coach card, daily brief, and weekly insight.',
    'Keep every field tight enough for a mobile app.'
  ].join('\n');
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const dashboard = mergeDashboardState(body.dashboard as Partial<DashboardState>);
    const geminiModel = getGeminiModel('GEMINI_COACH_MODEL', 'gemini-2.0-flash');
    const groqModel = getGroqModel('GROQ_COACH_MODEL', 'openai/gpt-oss-20b');

    const response = await generateStructuredAI({
      geminiModel,
      groqModel,
      prompt: buildCoachingPrompt(dashboard, body.userEmail),
      schema: coachResponseSchema,
      responseSchema: coachJsonSchema,
      schemaName: 'paceframe_coach_bundle'
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
