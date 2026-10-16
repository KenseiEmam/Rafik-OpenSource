import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export const backendRoot = resolve(import.meta.dirname, "../..");
export const repositoryRoot = resolve(backendRoot, "../..");
export const composeFile = resolve(repositoryRoot, "infrastructure/compose.yaml");

export const dockerCompose = (args, options = {}) =>
  execFileSync("docker", ["compose", "-f", composeFile, ...args], {
    cwd: backendRoot,
    ...options,
  });
