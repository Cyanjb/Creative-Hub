import { test } from "node:test";
import assert from "node:assert/strict";
import { fork, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixture } from "./fixtures/foundation";
async function start(root: string) {
  const child = fork(
    fileURLToPath(new URL("./restartServer.ts", import.meta.url)),
    {
      execArgv: ["--import", "tsx"],
      env: { ...process.env, PORT: "0", CREATIVE_HUB_STORAGE_ROOT: root },
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  let stderr = "";
  child.stderr?.on("data", (b) => (stderr += b));
  child.stdout?.resume();
  const port = await new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill();
      reject(Error("Server startup timeout " + stderr));
    }, 10000);
    child.once("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      reject(Error("Server exited " + code + " " + stderr));
    });
    child.once("message", (m: any) => {
      clearTimeout(timer);
      resolve(m.port);
    });
  });
  return { child, url: `http://127.0.0.1:${port}/api/v2/state` };
}
async function stop(child: ChildProcess) {
  const exited = once(child, "exit");
  child.kill("SIGTERM");
  await exited;
}
test("actual Express process restart reloads committed synthetic state", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "creative-hub-restart-"));
  let running = await start(root);
  const state = fixture();
  try {
    const response = await fetch(running.url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revision: 0, state }),
    });
    assert.equal(response.status, 200);
  } finally {
    await stop(running.child);
  }
  running = await start(root);
  try {
    const response = await (await fetch(running.url)).json();
    assert.equal(response.revision, 1);
    assert.deepEqual(response.state, state);
  } finally {
    await stop(running.child);
  }
});
