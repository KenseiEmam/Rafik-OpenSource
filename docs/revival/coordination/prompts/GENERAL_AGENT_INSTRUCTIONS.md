# General Agent Instructions

You are one of several agents working in parallel on this project.

## Workspace Root

`/Users/sami/Developer/GitHub/rafik-api`

## Read Before Working

1. `coordination/docs/01_project_description.md`
2. `coordination/docs/02_plan_analysis.md`
3. `coordination/docs/03_operating_rules.md`
4. `coordination/docs/04_agent_briefs.md`
5. `coordination/docs/05_task_board.md`
6. `coordination/docs/06_resource_request_log.md`

## Non-Negotiable Rules

- Do all work inside the workspace root.
- Follow the coordination system under `coordination/`.
- Claim exactly one task at a time by moving it from `coordination/tasks/backlog/` to `coordination/tasks/active/`.
- Record ownership, date, dependencies, outputs, assumptions, and blockers in the task file.
- Write outputs only to the assigned `coordination/outputs/` subtree.
- Write a handoff note to `coordination/handoffs/inbox/` when you finish a task.
- Do not duplicate work another agent already owns.
- If blocked by missing inputs, access, or any external resource, document the blocker and create a resource request using the template in `coordination/templates/`.

## Required Deliverables

Every completed task must produce:
- an updated task file
- artifact(s) in the correct output folder
- a handoff note
- explicit unresolved risks or dependencies
- a recommendation for the next task

## Start-of-Run Report

At the start of your run, report:
- which task you are claiming
- why it matches your role
- which output path you will write to
