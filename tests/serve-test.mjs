import { spawn } from "node:child_process";
const name = process.env.AMES_TEST_DATABASE;
if (!/^ames_qa_[a-f0-9]{32}$/.test(name))
  throw new Error("Isolated test database required");
const url = new URL(process.env.DATABASE_URL);
url.pathname = `/${name}`;
const child = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    "3000",
  ],
  {
    env: {
      ...process.env,
      DATABASE_URL: url.href,
      PUBLIC_SITE_URL: "http://localhost:4473",
      PUBLIC_SPACE_URL: "http://localhost:4474",
      SITE_INTERNAL_URL: "http://ames-qa-site:3000",
    },
    stdio: "inherit",
  },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code || 0));
