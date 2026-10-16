Start in /Users/sami/Developer/GitHub/rafik-api, read `coordination/prompts/GENERAL_AGENT_INSTRUCTIONS.md`, your agent-specific prompt, and `coordination/tasks/backlog/TASK-002_nutrition_research.md` completely, then follow the task exactly and report your task claim before doing work.

Important execution policy:
- Keep work within the assigned scope.
- Do not overwrite artifacts owned by another active task.
- Write outputs only to the task's declared primary output path.
- If blocked, move the task to `coordination/tasks/blocked/` and state the blocker precisely.

Reply with:
- whether the task was moved to active
- the first artifact produced
- whether any blocker remains

## Research quality and handoff
Read the matching task. Own only the declared output and a named handoff. Compare at least four primary sources; distinguish code and data/media rights, facts and inference, actionable value and integration complexity. No app edits or commits. Root verifies recommendations.
