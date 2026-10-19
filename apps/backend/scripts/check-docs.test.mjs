import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename } from "node:path";
import { headingIds, checkDocumentationLinks } from "./documentation-links.mjs";

test("heading IDs cover mixed language, inline code, duplicates and explicit anchors", () => {
  const ids = headingIds(
    '## Physical: Galaxy S20+\n## Use `node`\n## `access_token`\n## العربية\n## Repeat\n## Repeat\n<a id="manual"></a>\n```md\n## Hidden\n```',
  );
  for (const id of [
    "physical-galaxy-s20",
    "use-node",
    "العربية",
    "repeat",
    "repeat-1",
    "manual",
  ])
    assert.ok(ids.has(id), id);
  assert.ok(!ids.has("hidden"));
});

test("local targets and fragments are checked while code/external URLs are skipped", () => {
  const dir = mkdtempSync(join(tmpdir(), "rafik-docs-"));
  try {
    const main = join(dir, "README.md");
    writeFileSync(join(dir, "other file.md"), "# Other page\n## العربية\n");
    writeFileSync(
      main,
      "# Main\n[here](#main)\n[other](<other file.md#other-page>)\n[Arabic](other%20file.md#%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9)\n[broken](other%20file.md#missing)\n[absent](absent.md)\n[remote](https://example.test/missing)\n`[code](ignored.md)`\n~~~md\n[code](also-ignored.md)\n~~~\n",
    );
    const result = checkDocumentationLinks([main]);
    assert.equal(result.links, 5);
    assert.equal(result.fragments, 4);
    assert.deepEqual(
      result.failures.map((f) => f.reason),
      ["missing heading/anchor", "missing target"],
    );
  } finally {
    assert.equal(dirname(dir), resolve(tmpdir()));
    assert.ok(basename(dir).startsWith("rafik-docs-"));
    rmSync(dir, { recursive: true, force: true });
  }
});
