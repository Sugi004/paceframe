# MCP Layer

The MCP package gives AI agents safe, structured access to life-management context.

## Initial tools

- `get_today_plan`: fetches the user's recommended plan
- `get_energy_state`: returns the current self-reported energy profile
- `get_recovery_protocols`: lists recovery flows for the user's state
- `get_weekly_summary`: returns completion, stress, and care consistency data
- `list_reminders`: returns enabled reminder configuration
- `get_completed_tasks`: returns completed tasks for review or reflection

## Why MCP here

This app depends on high-context decision making. MCP provides a clean boundary so AI tools can help without mixing directly into client code.
