# Working in parallel

Sami and Kensei each work with their own coding agent, in this repository and in [rafik-landing](https://github.com/KenseiEmam/rafik-landing). Neither agent can see the other's conversation. GitHub is the shared record: anything the other side must know has to be in a PR, a comment or a committed file.

## What goes wrong without this

- Two PRs change the same screens, shared components or generated files and conflict at merge time.
- A founder or reviewer instruction given to one agent (scope, wording, "don't touch X", environment facts) never reaches the other agent.
- One PR builds on behaviour or an API shape that another open PR is changing.
- Every PR edits `CHANGELOG.md` and the ledger, so they conflict even when the code doesn't.
- Work in one repository waits on another (for example landing docs waiting on an app PR) without either side knowing.
- Both agents spend time on the same broken test or environment problem.
- A review lands on a commit that has already been replaced.

## The protocol

1. **Open a draft PR at the start of a task.** Push the branch and open a draft using the [PR template](../../.github/pull_request_template.md). Fill in Goal, Areas, Contract changes and Depends on, and keep them current. This is what makes your work visible to the other agent.
2. **Run the coordination check before starting and before pushing.**

   ```bash
   npm run coord:check -- --plan apps/frontend/src/features/nutrition/,docs/DESIGN_SYSTEM.md
   ```

   It lists open PRs in both repositories, with their author, branch, Areas and Contract changes, and flags:
   - PRs that change the same files as your branch or your `--plan` paths;
   - PRs in the same shared area (API contract, schema, design system, routing, agent rules, release; landing design, pages, docs, translations, contact);
   - open PRs that overlap each other, whoever owns them;
   - commits that landed on the default branch since your branch started (rebase before building on them);
   - new entries in the decisions log;
   - `[agent-note]` comments from the last 14 days.

   When it finds an overlap: read the other PR, then build on it, agree a split in an `[agent-note]` comment, or narrow your scope. Record which in your PR's **Depends on** section. `--strict` exits with status 2 when overlaps exist, for hooks or CI.

3. **Record cross-cutting decisions** in the [decisions log](decisions.md) in the same PR: anything the other contributor's agent must follow.
4. **Leave notes for the other agent** as PR or issue comments starting with `[agent-note]`, for example:
   - `[agent-note] depends-on #142: rebasing this after the route cleanup merges`
   - `[agent-note] contract-change: recipients now return email for admins`
   - `[agent-note] handoff: tests X and Y still fail on main, not caused by this PR`

   The check script shows these notes to the other agent on its next run.

5. **Add a change note instead of editing shared files.** Write `changes/<branch-name>.md` as described in [changes/README.md](../../changes/README.md). `npm run changes:compile` folds the notes into `CHANGELOG.md` and the ledger at release time.

## Running the check automatically

The protocol is in `AGENTS.md`, which Codex and Claude Code both read. To run the check without relying on the agent remembering:

- **Claude Code:** add a `SessionStart` hook in your own `.claude/settings.local.json` (not committed):

  ```json
  {
    "hooks": {
      "SessionStart": [
        { "hooks": [{ "type": "command", "command": "npm run --silent coord:check" }] }
      ]
    }
  }
  ```

- **Codex and other agents:** the `AGENTS.md` rule requires running it at the start of a task and before pushing.

The script needs Node 22 or newer and network access to GitHub. It uses `GH_TOKEN`, `GITHUB_TOKEN` or a signed-in `gh` CLI if present; without a token it still works on public repositories, within GitHub's lower rate limit. The landing repository has an identical copy of `scripts/coordination/check.mjs` and `.github/coordination.json`; the check warns when the copies differ, so change both together.

## Why not a custom MCP server

An MCP server only adds tools an agent can call; it doesn't make the agent aware of anything unless it already knows to look. A custom coordination server would also need hosting, authentication and its own state outside Git. GitHub already holds the PRs, files and comments both agents use. If an agent can't run the `gh` CLI or reach the GitHub API, GitHub's official MCP server gives it the same data.

Everything written through this process is public: never put credentials, keys, private contact details or athlete data in PRs, notes or the decisions log.
