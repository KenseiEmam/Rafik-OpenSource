import { test } from "node:test";
import assert from "node:assert/strict";
import { assertLocalRelease } from "./release-guard.mjs";
const local = {
  nodeVersion: "v22.16.0",
  config: 'project_id = "rafik-revamp-local"',
  linked: false,
  branches: ["codex/revamp", "codex/revamp"],
  webEnvironment: "VITE_SUPABASE_URL=http://127.0.0.1:55321\n",
};
test("allows only the pinned unlinked pair of revamp checkouts and exact local API", () =>
  assert.doesNotThrow(() => assertLocalRelease(local)));
for (const [name, change] of Object.entries({
  "remote link": { linked: true },
  "wrong project": { config: 'project_id = "other"' },
  "main branch": { branches: ["codex/revamp", "main"] },
  "wrong Node": { nodeVersion: "v24.0.0" },
  "remote web API": {
    webEnvironment: "VITE_SUPABASE_URL=https://example.supabase.co",
  },
  "misleading local prefix": {
    webEnvironment: "VITE_SUPABASE_URL=http://127.0.0.1:55321.example.com",
  },
}))
  test(`rejects ${name} before running checks`, () =>
    assert.throws(() => assertLocalRelease({ ...local, ...change })));
