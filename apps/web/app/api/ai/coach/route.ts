import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
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

const requestSchema = z.object({
  dashboard: z.unknown(),
  userEmail: z.string().email().nullable().optional()
});

const responseSchema = z.object({
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

const openaiApiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_COACH_MODEL ?? 'gpt-4o-mini';

const client = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

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
  if (!client) {
    return Response.json(
      {
        error: 'OPENAI_API_KEY is missing on the web server. Add it to the project environment before using live AI coaching.'
      },
      { status: 503 }
    );
  }

  try {
    const body = requestSchema.parse(await request.json());
    const dashboard = mergeDashboardState(body.dashboard as Partial<DashboardState>);

    const response = await client.responses.parse({
      model,
      input: buildCoachingPrompt(dashboard, body.userEmail),
      text: {
        format: zodTextFormat(responseSchema, 'paceframe_live_coaching')
      }
    });

    if (!response.output_parsed) {
      return Response.json(
        {
          error: 'The AI coach did not return structured coaching.'
        },
        { status: 502 }
      );
    }

    return Response.json({
      data: {
        ...response.output_parsed,
        generatedAt: new Date().toISOString(),
        model
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live AI coaching failed.';
    return Response.json({ error: message }, { status: 500 });
  }
}
