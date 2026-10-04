import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { parse } from "@babel/parser";
import { root } from "./lib/environment.mjs";

// Tracked and new source files only; private/generated files stay unread.
const git = (args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8" });
const files = [
  ...new Set(
    git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean),
  ),
];
const failures = [];
let modules = 0;
for (const entry of git(["ls-files", "--stage"]).split("\n")) {
  if (entry.startsWith("160000 "))
    failures.push("Un dépôt imbriqué est enregistré comme sous-module.");
}
for (const file of files) {
  if (
    /^(?:data|refs|(?:ame-errante|ames-errantes-interne)\/data)\//.test(file) ||
    /(^|\/)(?:node_modules|\.next)\//.test(file) ||
    /(^|\/)\.env(?!\.example$)/.test(file) ||
    /\.(?:sqlite(?:-\w+)?|dump|bundle|pem|key)$/.test(file) ||
    /^deploy\/raspberry\/(?:active|target)\.json$/.test(file)
  ) {
    failures.push(`${file} : fichier privé ou généré dans le dépôt.`);
    continue;
  }
  const absolute = resolve(root, file);
  if (!existsSync(absolute)) continue; // A deletion pending commit.
  const extension = extname(file);
  if (
    ![
      ".js",
      ".jsx",
      ".mjs",
      ".json",
      ".md",
      ".yaml",
      ".yml",
      ".sh",
      ".ps1",
    ].includes(extension)
  )
    continue;
  const source = readFileSync(absolute, "utf8");
  if (
    /-----BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bsk-proj-[A-Za-z0-9_-]{30,}/.test(
      source,
    )
  )
    failures.push(`${file} : motif de secret détecté (valeur masquée).`);
  try {
    if (extension === ".json") JSON.parse(source);
    if ([".js", ".jsx", ".mjs"].includes(extension)) {
      const ast = parse(source, { sourceType: "module", plugins: ["jsx"] });
      modules++;
      for (const node of ast.program.body) {
        const specifier = node.source?.value;
        if (typeof specifier !== "string" || !specifier.startsWith("."))
          continue;
        const base = resolve(dirname(absolute), specifier);
        if (
          !["", ".js", ".jsx", ".mjs", "/index.js", "/index.jsx"].some(
            (suffix) => existsSync(base + suffix),
          )
        )
          failures.push(`${file} : import local introuvable (${specifier}).`);
      }
    }
  } catch (error) {
    failures.push(`${file} : ${error.message}`);
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    `Contrôle réussi : ${files.length} fichiers, ${modules} modules, imports locaux et exclusions Git.`,
  );
