# Change notes

Each PR adds **one** note file here instead of editing `CHANGELOG.md` and `docs/development/ledger.md` directly. Parallel PRs then never conflict on those two shared files.

Name the file after your branch, for example `changes/agent-coordination.md`:

```markdown
## Changelog

- What changed for users, operators or contributors, in plain words.

## Ledger

- **23 October — Short title:** what was done, decisions taken and what remains open.
```

- `## Changelog` is required. `## Ledger` is optional for small fixes.
- Each section is a Markdown list. Write it exactly as it should appear in the final file.
- Edit your own note as the PR changes. Never edit another PR's note.
- `npm run changes:check` validates every note. At release time (or when a maintainer chooses), `npm run changes:compile` inserts the notes under `## Unreleased` and `## Recent work`, then deletes them.
