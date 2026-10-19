// Check local links across current human-maintained monorepo documentation.
import { readdirSync, statSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { checkDocumentationLinks } from "./documentation-links.mjs";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function markdown(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name.startsWith(".") || name === "node_modules" || name === "backups")
      return [];
    const path = resolve(dir, name);
    const normalized = path.replaceAll("\\", "/");
    if (
      normalized.includes("/docs/archive/") ||
      normalized.includes("/docs/revival/")
    )
      return [];
    if (normalized.includes("/docs/verification/receipts/")) return [];
    return statSync(path).isDirectory()
      ? markdown(path)
      : path.endsWith(".md")
        ? [path]
        : [];
  });
}

const files = [
  ...[
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "CHANGELOG.md",
    "SECURITY.md",
  ].map((path) => resolve(repo, path)),
  ...[
    "apps/frontend/README.md",
    "apps/backend/README.md",
    "apps/mobile/README.md",
  ].map((path) => resolve(repo, path)),
  ...markdown(resolve(repo, "docs")),
  ...markdown(resolve(repo, "infrastructure")),
];
const { failures, links, fragments } = checkDocumentationLinks(files);

if (failures.length) {
  console.error(
    failures
      .map(
        ({ file, link, reason }) =>
          `${relative(repo, file)}: ${link} (${reason})`,
      )
      .join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log(
    `Checked ${links} local links and ${fragments} heading links in ${files.length} maintained documents (including infrastructure). External URLs were not fetched.`,
  );
}
