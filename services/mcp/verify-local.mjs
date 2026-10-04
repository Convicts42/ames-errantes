import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
const command = join(
  process.env.LOCALAPPDATA,
  "Programs/DockerDesktop/resources/bin/docker.exe",
);
const client = new Client({ name: "ames-connection-check", version: "1.0.0" });
try {
  await client.connect(
    new StdioClientTransport({
      command,
      args: [
        "compose",
        "--project-directory",
        resolve("."),
        "exec",
        "-T",
        "espace",
        "node",
        "/app/services/mcp/server.mjs",
      ],
      stderr: "inherit",
    }),
  );
  const { tools } = await client.listTools();
  assert.equal(tools.length, 18);
  const result = await client.callTool({
    name: "project_overview",
    arguments: {},
  });
  assert.ok(!result.isError);
  const data = JSON.parse(result.content[0].text);
  assert.equal(data.documents.length, 15);
  assert.equal(data.tasks.length, 5);
  console.log(
    `MCP local opérationnel : ${tools.length} outils, ${data.documents.length} documents, ${data.tasks.length} points à suivre. Aucune écriture de test.`,
  );
} finally {
  await client.close();
}
