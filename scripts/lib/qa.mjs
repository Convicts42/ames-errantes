import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./environment.mjs";

// Dedicated project and credentials: never attach to the archived local database.
export function qaComposeArgs(args) {
  try {
    writeFileSync(
      join(root, ".env.qa"),
      `QA_POSTGRES_PASSWORD=${randomBytes(32).toString("hex")}\n`,
      { flag: "wx", mode: 0o600 },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
  }
  return [
    "compose",
    "--project-directory",
    root,
    "--env-file",
    join(root, ".env.qa"),
    "-f",
    join(root, "compose.qa.yaml"),
    ...args,
  ];
}
