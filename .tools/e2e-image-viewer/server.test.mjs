import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { mkdir, readFile, realpath, rm, stat, utimes, writeFile } from "node:fs/promises";

const TOOL_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(TOOL_DIR, "..", "..");
const SERVER_ENTRY = join(TOOL_DIR, "server.mjs");
const EVIDENCE_ROOT = join(PROJECT_ROOT, "test-results", "evidence-screenshots");
const STATE_PATH = join(EVIDENCE_ROOT, ".e2e-image-viewer-state.json");

const getFreePort = async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : null;
  await new Promise((resolveClose) => server.close(resolveClose));
  assert.ok(port, "must resolve a free TCP port");
  return port;
};

const waitForExit = async (child) => {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    once(child, "exit"),
    new Promise((resolveTimeout) => setTimeout(resolveTimeout, 1500)),
  ]);
};

const requestJson = async (port, pathName, options = {}) => {
  const response = await fetch(`http://127.0.0.1:${port}${pathName}`, {
    ...options,
    headers: options.body
      ? { "content-type": "application/json", ...(options.headers ?? {}) }
      : options.headers,
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
};

const waitForHealth = async (port, readLogs) => {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      return await requestJson(port, "/api/health");
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  }
  throw new Error(`viewer server did not become healthy:\n${readLogs()}`);
};

test("focus and selected files keep the listing on the requested directory", async () => {
  const hadState = existsSync(STATE_PATH);
  const stateSnapshot = hadState ? await readFile(STATE_PATH, "utf8") : null;
  const tempRoot = join(EVIDENCE_ROOT, `viewer-regression-${process.pid}-${Date.now()}`);
  const targetDirRaw = join(tempRoot, "target");
  const newerChildDirRaw = join(targetDirRaw, "latest-child");
  let child = null;

  try {
    await mkdir(newerChildDirRaw, { recursive: true });
    await writeFile(join(targetDirRaw, "focus.png"), "focus");
    await writeFile(join(newerChildDirRaw, "newer.png"), "newer");
    await writeFile(join(targetDirRaw, ".e2e-image-index.json"), JSON.stringify({
      title: "中文验收图组",
      items: [
        {
          path: "focus.png",
          label: "目标验收图",
          description: "只展示本轮 PASS 清单媒体",
        },
      ],
    }, null, 2));

    const future = new Date(Date.now() + 3000);
    await utimes(join(newerChildDirRaw, "newer.png"), future, future);

    const targetDir = await realpath(targetDirRaw);
    const port = await getFreePort();
    const logs = [];
    child = spawn(process.execPath, [SERVER_ENTRY, "--serve", "--port", String(port)], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    child.stdout.on("data", (chunk) => logs.push(String(chunk)));
    child.stderr.on("data", (chunk) => logs.push(String(chunk)));

    const health = await waitForHealth(port, () => logs.join(""));
    assert.equal(health.app, "boardgame-e2e-image-viewer");

    await requestJson(port, "/api/register", {
      method: "POST",
      body: JSON.stringify({
        dir: targetDir,
        focus: "focus.png",
        files: ["focus.png"],
      }),
    });

    const explicitList = await requestJson(
      port,
      `/api/list?dir=${encodeURIComponent(targetDir)}&focus=focus.png&show=focus.png`,
    );
    assert.equal(explicitList.directory, targetDir);
    assert.equal(explicitList.autoSelectedDirectory, false);
    assert.equal(explicitList.selectedBy, "requested-focus");
    assert.deepEqual(explicitList.selectedFiles, ["focus.png"]);
    assert.equal(explicitList.directoryTitle, "中文验收图组");
    assert.equal(explicitList.items.length, 1);
    assert.equal(explicitList.items[0].relativePath, "focus.png");
    assert.equal(explicitList.items[0].displayTitle, "目标验收图");

    const registeredList = await requestJson(
      port,
      `/api/list?dir=${encodeURIComponent(targetDir)}`,
    );
    assert.equal(registeredList.directory, targetDir);
    assert.equal(registeredList.autoSelectedDirectory, false);
    assert.equal(registeredList.selectedBy, "registered-focus");
    assert.deepEqual(registeredList.selectedFiles, ["focus.png"]);
    assert.equal(registeredList.items.length, 1);

    const childImage = join(newerChildDirRaw, "newer.png");
    assert.equal((await stat(childImage)).isFile(), true);
  } finally {
    await waitForExit(child);
    await rm(tempRoot, { recursive: true, force: true });
    if (hadState && stateSnapshot !== null) {
      await writeFile(STATE_PATH, stateSnapshot, "utf8");
    } else {
      await rm(STATE_PATH, { force: true });
    }
  }
});
