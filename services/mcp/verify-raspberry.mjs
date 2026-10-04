import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
const target = JSON.parse(
  await readFile(
    new URL("../../deploy/raspberry/target.json", import.meta.url),
    "utf8",
  ),
);
const client = new Client({ name: "ames-raspberry-check", version: "1.0.0" });
try {
  await client.connect(
    new StdioClientTransport({
      command:
        process.platform === "win32"
          ? "C:/Windows/System32/OpenSSH/ssh.exe"
          : "ssh",
      args: [
        "-o",
        "BatchMode=yes",
        "-o",
        "ConnectTimeout=10",
        "-T",
        target.ssh,
        `bash ${target.root}/current/deploy/raspberry/amesctl.sh mcp`,
      ],
      stderr: "inherit",
      env:
        process.platform === "win32"
          ? { PROGRAMDATA: process.env.PROGRAMDATA }
          : undefined,
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
  assert.ok(Array.isArray(data.documents) && Array.isArray(data.tasks));
  if (data.documents[0]) {
    const read = await client.callTool({
      name: "document_read",
      arguments: { id: data.documents[0].id },
    });
    assert.ok(!read.isError);
    assert.equal(
      JSON.parse(read.content[0].text).document.id,
      data.documents[0].id,
    );
  }
  console.log(
    `MCP SSH Raspberry : ${tools.length} outils, ${data.documents.length} documents et ${data.tasks.length} points lus directement. Aucune ecriture dans le projet.`,
  );
} finally {
  await client.close();
}
