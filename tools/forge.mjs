import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const localFile = resolve(root, "forge.local.json");
const local = existsSync(localFile) ? JSON.parse(readFileSync(localFile, "utf8")) : {};
const configuredRoot = process.env.FORGE_ROOT ?? local.forgeRoot ?? "../../Forge";
if (typeof configuredRoot !== "string" || !configuredRoot.trim()) throw new Error("Forge root must be a nonempty path");
const forgeRoot = resolve(root, configuredRoot);
const tool = resolve(forgeRoot, "tools/run-game-project.mjs");
if (!existsSync(tool)) throw new Error(`Forge project tool not found: ${tool}. Set FORGE_ROOT or forge.local.json.`);
const command = process.argv[2] ?? "dev";
const child = spawn(process.execPath, [tool, command, "--project", root, ...process.argv.slice(3)], {
  cwd: forgeRoot, stdio: "inherit", shell: false,
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
