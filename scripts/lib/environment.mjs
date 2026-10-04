import { existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const docker =
  process.env.DOCKER_COMMAND ||
  (process.platform === "win32"
    ? [
        join(
          process.env.LOCALAPPDATA || "",
          "Programs/DockerDesktop/resources/bin/docker.exe",
        ),
        join(
          process.env.ProgramFiles || "C:/Program Files",
          "Docker/Docker/resources/bin/docker.exe",
        ),
      ].find(existsSync) || "docker"
    : "docker");
