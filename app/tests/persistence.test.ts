import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fork } from "node:child_process";
import { Repository, Conflict } from "../server/storage/repository";
import { backup, restore } from "../server/storage/backup";
import { storageRoot } from "../server/storage/config";
import { fixture } from "./fixtures/foundation";
import { makeAsset } from "../src/lib/factories";
import { SaveCoordinator } from "../src/lib/v2Persistence";
import { stateSchema } from "../shared/v2Schema";
const root = () =>
  fs.mkdtempSync(path.join(os.tmpdir(), "creative-hub-v2-test-"));
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZQAAAABJRU5ErkJggg==",
  "base64",
);
test("SQLite roundtrip and stale revisions preserve newer data", () => {
  const dir = root();
  let repo = new Repository(dir);
  const s = fixture();
  repo.save({ revision: 0, state: s });
  const newer = structuredClone(s);
  newer.shots[0].title = "Committed";
  repo.save({ revision: 1, state: newer });
  assert.throws(() => repo.save({ revision: 1, state: s }), Conflict);
  assert.equal(repo.read().state.shots[0].title, "Committed");
  repo.close();
  repo = new Repository(dir);
  assert.deepEqual(repo.read(), { revision: 2, state: newer });
  repo.close();
});
test("invalid state never changes revision; unsupported database fails", () => {
  const repo = new Repository(root());
  assert.throws(() =>
    repo.save({ revision: 0, state: { ...fixture(), schemaVersion: 3 } }),
  );
  assert.equal(repo.read().revision, 0);
  const dir = repo.root;
  repo.db.pragma("user_version=99");
  repo.close();
  assert.throws(() => new Repository(dir), /Unsupported/);
});
test("media failures leave explicit errors, no valid records; finalization is recoverable", () => {
  const repo = new Repository(root());
  repo.save({ revision: 0, state: fixture() });
  for (const stage of ["write", "rename", "finalize"] as const) {
    assert.throws(() =>
      repo.stageMedia(
        "asset-" + stage,
        "production-demo",
        "image/png",
        png,
        stage,
      ),
    );
    assert.equal(repo.media("asset-" + stage)!.state, "error");
    const s = repo.read().state;
    s.assets.push({ ...makeAsset("production-demo"), id: "asset-" + stage });
    assert.throws(() => repo.save({ revision: 1, state: s }), /not preserved/);
    assert.equal(repo.read().revision, 1);
    if (stage !== "write") {
      const m = repo.recoverMedia("asset-" + stage);
      assert.equal(m.state, "ready");
      assert.ok(repo.verifyMedia(m));
    }
  }
  assert.equal(repo.media("asset-write")!.state, "error");
  repo.close();
});
test("missing ready media becomes explicit error on restart", () => {
  const dir = root();
  let repo = new Repository(dir);
  repo.save({ revision: 0, state: fixture() });
  const m = repo.stageMedia("asset", "production-demo", "image/png", png);
  fs.renameSync(
    path.join(dir, m.relative_path),
    path.join(dir, m.relative_path + ".held-for-test"),
  );
  repo.close();
  repo = new Repository(dir);
  assert.equal(repo.media("asset")!.state, "error");
  repo.close();
});
test("consistent live-WAL backup restores identities, order, placements, planning, wires and bytes", async () => {
  const repo = new Repository(root());
  repo.save({ revision: 0, state: fixture() });
  const m = repo.stageMedia("asset", "production-demo", "image/png", png);
  const s = repo.read().state;
  s.assets.push({
    ...makeAsset("production-demo"),
    id: "asset",
    width: 1,
    height: 1,
  });
  (s.boards[0].nodes[3] as any).assetId = "asset";
  s.projects[0].shotOrder.reverse();
  repo.save({ revision: 1, state: s });
  const location = await backup(repo);
  const destination = path.join(root(), "restored");
  const restored = restore(location, destination);
  assert.deepEqual(restored.read(), repo.read());
  assert.equal(restored.media("asset")!.sha256, m.sha256);
  assert.deepEqual(
    fs.readFileSync(path.join(destination, m.relative_path)),
    png,
  );
  restored.close();
  assert.throws(() => restore(location, destination), /new separate root/);
  fs.appendFileSync(path.join(location, m.relative_path), "corrupt");
  assert.throws(() => restore(location, path.join(root(), "bad")), /checksum/);
  repo.close();
});
test("restore validates domain structure, not just SQLite integrity", async () => {
  const repo = new Repository(root());
  repo.save({ revision: 0, state: fixture() });
  repo.db
    .prepare("UPDATE shots SET json=? WHERE id=?")
    .run(
      JSON.stringify({ ...repo.read().state.shots[0], surprise: true }),
      "shot-one",
    );
  const location = await backup(repo);
  assert.throws(() => restore(location, path.join(root(), "invalid")));
  repo.close();
});
test("save coordinator surfaces failure, retains dirty revision, retries and serializes new edits", async () => {
  let fail = true;
  const statuses: string[] = [];
  const state = fixture();
  const c = new SaveCoordinator(
    () => state,
    async (s, r) => {
      if (fail) throw Error("disk full");
      return { state: s, revision: r + 1 };
    },
    (s, e) => statuses.push(s + (e ? ":" + e : "")),
  );
  c.changed();
  await assert.rejects(c.flush(), /disk full/);
  assert.equal(c.revision, 0);
  assert.equal(c.acknowledged, 0);
  assert.equal(statuses.at(-1), "error:disk full");
  fail = false;
  await c.flush();
  assert.equal(c.revision, 1);
  assert.equal(c.acknowledged, c.generation);
  let release: () => void = () => {};
  let calls = 0;
  const d = new SaveCoordinator(
    () => state,
    async (s, r) => {
      calls++;
      if (calls === 1)
        await new Promise<void>((resolve) => (release = resolve));
      return { state: s, revision: r + 1 };
    },
    (s) => statuses.push(s),
  );
  d.changed();
  const pending = d.flush();
  d.changed();
  assert.equal(statuses.at(-1), "pending");
  release();
  await pending;
  assert.equal(calls, 2);
  assert.equal(d.revision, 2);
  assert.equal(d.acknowledged, 2);
  assert.equal(statuses.at(-1), "saved");
});
test("managed root rejects repository, original source and preservation locations", () => {
  for (const folder of [
    "Creative-Hub-repo",
    "Creative Hub",
    "Creative-Hub-Preservation",
  ])
    assert.throws(
      () => storageRoot(path.join(os.homedir(), folder, "runtime")),
      /outside/,
    );
});
