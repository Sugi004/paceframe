import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { buildAICoachCard, buildDailyBrief, buildTodayPlan, buildWeeklySummary, getBurnoutSignal, getCompletedTasks, mockDashboard, recoveryProtocols } from '@paceframe/shared';

const server = new Server(
  {
    name: 'paceframe-mcp',
    version: '0.1.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_today_plan',
      description: 'Returns the current prioritized day plan for the user.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'get_energy_state',
      description: 'Returns the current energy and burnout signal.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'get_recovery_protocols',
      description: 'Lists recovery protocols based on burnout level.',
      inputSchema: {
        type: 'object',
        properties: {
          level: { type: 'string', enum: ['low', 'moderate', 'high'] }
        },
        required: ['level'],
        additionalProperties: false
      }
    },
    {
      name: 'get_weekly_summary',
      description: 'Returns completion, care consistency, and stress summary for the week.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'list_reminders',
      description: 'Returns the user reminder configuration for meals, movement, rest, and hydration.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'get_completed_tasks',
      description: 'Returns completed tasks so an assistant can celebrate progress or build a review.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'get_ai_coach_card',
      description: 'Returns the current AI coach recommendation for the user state.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    },
    {
      name: 'get_daily_brief',
      description: 'Returns the current morning-style brief with focus block and recovery anchor.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'get_today_plan') {
    const plan = buildTodayPlan(mockDashboard);
    return {
      content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }]
    };
  }

  if (request.params.name === 'get_energy_state') {
    const signal = getBurnoutSignal(mockDashboard.energyState);
    return {
      content: [{ type: 'text', text: JSON.stringify({ energyState: mockDashboard.energyState, signal }, null, 2) }]
    };
  }

  if (request.params.name === 'get_recovery_protocols') {
    const schema = z.object({ level: z.enum(['low', 'moderate', 'high']) });
    const args = schema.parse(request.params.arguments ?? {});
    return {
      content: [{ type: 'text', text: JSON.stringify(recoveryProtocols[args.level], null, 2) }]
    };
  }

  if (request.params.name === 'get_weekly_summary') {
    return {
      content: [{ type: 'text', text: JSON.stringify(buildWeeklySummary(mockDashboard), null, 2) }]
    };
  }

  if (request.params.name === 'list_reminders') {
    return {
      content: [{ type: 'text', text: JSON.stringify(mockDashboard.reminders, null, 2) }]
    };
  }

  if (request.params.name === 'get_completed_tasks') {
    return {
      content: [{ type: 'text', text: JSON.stringify(getCompletedTasks(mockDashboard.tasks), null, 2) }]
    };
  }

  if (request.params.name === 'get_ai_coach_card') {
    return {
      content: [{ type: 'text', text: JSON.stringify(buildAICoachCard(mockDashboard), null, 2) }]
    };
  }

  if (request.params.name === 'get_daily_brief') {
    return {
      content: [{ type: 'text', text: JSON.stringify(buildDailyBrief(mockDashboard), null, 2) }]
    };
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('MCP server failed', error);
  process.exit(1);
});
