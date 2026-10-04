import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
export async function mcpClient(databaseUrl, work) {
  const client = new Client({
    name: "ames-integration-test",
    version: "1.0.0",
  });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("./server.mjs", import.meta.url))],
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stderr: "inherit",
  });
  try {
    await client.connect(transport);
    return await work(client);
  } finally {
    await client.close();
  }
}
