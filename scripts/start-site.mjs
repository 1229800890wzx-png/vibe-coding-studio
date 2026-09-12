import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, closeSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT || 4173);
const url = `http://127.0.0.1:${port}/`;

async function isReady() {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(1500) });
  } catch {
    return false;
  }
  const html = await response.text();
  if (!response.ok || !html.includes("VIBE CODING")) {
    throw new Error(`Port ${port} is serving another page. Close it or choose a different PORT.`);
  }
  return true;
}

try {
  if (!existsSync(path.join(root, "dist/index.html"))) {
    throw new Error("Run npm install and npm run build first.");
  }
  if (!(await isReady())) {
    const logDir = path.join(root, "output/server");
    mkdirSync(logDir, { recursive: true });
    const stdout = openSync(path.join(logDir, "preview.log"), "a");
    const stderr = openSync(path.join(logDir, "preview-error.log"), "a");
    let child;
    try {
      child = spawn(process.execPath, [path.join(root, "scripts/serve.mjs")], {
        cwd: root,
        detached: true,
        windowsHide: true,
        stdio: ["ignore", stdout, stderr],
      });
    } finally {
      closeSync(stdout);
      closeSync(stderr);
    }
    let spawnError;
    child.on("error", (error) => { spawnError = error; });
    child.unref();
    const deadline = Date.now() + 15000;
    while (!(await isReady())) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || Date.now() >= deadline) {
        throw new Error("Preview did not start. See output/server/preview-error.log.");
      }
      await delay(200);
    }
    console.log(`Preview is running in the background (PID ${child.pid}).`);
  }
  console.log(`Ready: ${url}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
