import { fork } from "node:child_process";
import { once } from "node:events";

export default async function globalSetup() {
  const server = fork(
    new URL("../scripts/test-server.mjs", import.meta.url),
    [],
    {
      stdio: ["ignore", "ignore", "inherit", "ipc"],
      windowsHide: true,
    },
  );
  const ready = once(server, "message");
  let timer;
  try {
    await Promise.race([
      ready,
      once(server, "exit").then(() => {
        throw new Error("Le serveur de test s’est arrêté avant son démarrage.");
      }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Le serveur de test ne répond pas.")),
          30000,
        );
      }),
    ]);
  } catch (error) {
    server.kill();
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return async () => {
    if (server.exitCode !== null) return;
    const exited = once(server, "exit");
    server.kill();
    await exited;
  };
}
