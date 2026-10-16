import { test } from "node:test";
import assert from "node:assert/strict";
import { assertLocalRelease } from "./release-guard.mjs";
const local = {
  nodeVersion: "v22.16.0",
  config: 'name: rafik-prisma-local',
  linked: false,
  branch: "codex/university-revamp-plan",
  webEnvironment: "VITE_API_URL=http://127.0.0.1:55331\n",
};
test("allows the pinned monorepo branch and exact local API", () =>
  assert.doesNotThrow(() => assertLocalRelease(local)));
for (const [name, change] of Object.entries({
  "remote link": { linked: true },
  "wrong project": { config: 'project_id = "other"' },
  "main branch": { branch: "main" },
  "wrong Node": { nodeVersion: "v24.0.0" },
  "remote web API": {
    webEnvironment: "VITE_API_URL=https://example.supabase.co",
  },
  "misleading local prefix": {
    webEnvironment: "VITE_API_URL=http://127.0.0.1:55331.example.com",
  },
}))
  test(`rejects ${name} before running checks`, () =>
    assert.throws(() => assertLocalRelease({ ...local, ...change })));
