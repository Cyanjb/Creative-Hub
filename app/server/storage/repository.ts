import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  emptyState,
  saveSchema,
  stateSchema,
  id,
  type HubState,
} from "../../shared/v2Schema";
import { inside, storageRoot } from "./config";
export const hash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
export class Conflict extends Error {}
export type MediaRow = {
  id: string;
  production_id: string;
  relative_path: string;
  stage_path: string;
  sha256: string;
  size: number;
  mime: string;
  state: "staged" | "finalizing" | "ready" | "error";
  error: string | null;
};
export class Repository {
  db: Database.Database;
  root: string;
  constructor(root?: string, allowIncompleteRestore = false) {
    this.root = storageRoot(root);
    if (
      !allowIncompleteRestore &&
      fs.existsSync(path.join(this.root, ".restore-incomplete"))
    )
      throw Error("Incomplete restore; use a new destination and retry");
    for (const p of ["database", "staging", "backups", "productions"])
      fs.mkdirSync(path.join(this.root, p), { recursive: true });
    this.db = new Database(path.join(this.root, "database", "hub.sqlite"));
    this.db.pragma("foreign_keys=ON");
    this.db.pragma("journal_mode=WAL");
    this.db.pragma("synchronous=FULL");
    const version = this.db.pragma("user_version", { simple: true });
    if (version !== 0 && version !== 1) {
      this.db.close();
      throw Error("Unsupported database schema " + version);
    }
    if (version === 0)
      this.db.transaction(() =>
        this.db.exec(
          fs.readFileSync(
            fileURLToPath(
              new URL("./migrations/001-foundation.sql", import.meta.url),
            ),
            "utf8",
          ),
        ),
      )();
    this.verifyReadyMedia();
  }
  close() {
    this.db.close();
  }
  read() {
    const state = emptyState();
    const parse = (table: string) =>
      this.db
        .prepare(`SELECT json FROM ${table} ORDER BY rowid`)
        .all()
        .map((r: any) => JSON.parse(r.json));
    state.projects = parse("productions");
    state.shots = parse("shots");
    state.boards = parse("boards");
    for (const p of state.projects)
      p.shotOrder = (
        this.db
          .prepare(
            "SELECT shot_id FROM shot_order WHERE production_id=? ORDER BY position",
          )
          .all(p.id) as any[]
      ).map((r) => r.shot_id);
    for (const b of state.boards) {
      b.nodes = (
        this.db
          .prepare("SELECT json FROM nodes WHERE board_id=? ORDER BY position")
          .all(b.id) as any[]
      ).map((r) => JSON.parse(r.json));
      b.wires = (
        this.db
          .prepare("SELECT json FROM wires WHERE board_id=? ORDER BY position")
          .all(b.id) as any[]
      ).map((r) => JSON.parse(r.json));
    }
    for (const r of this.db
      .prepare("SELECT * FROM collections")
      .all() as any[]) {
      if (
        ![
          "characters",
          "worlds",
          "scripts",
          "assets",
          "resources",
          "links",
          "notes",
          "workflowTemplates",
        ].includes(r.name)
      )
        throw Error("Unknown durable collection");
      (state as any)[r.name] = JSON.parse(r.json);
    }
    return {
      revision: (this.db.prepare("SELECT revision FROM meta").get() as any)
        .revision as number,
      state: stateSchema.parse(state),
    };
  }
  save(input: unknown) {
    const { state, revision } = saveSchema.parse(input);
    this.verifyReadyMedia();
    return this.db.transaction(() => {
      const current = (
        this.db.prepare("SELECT revision FROM meta").get() as any
      ).revision;
      if (revision !== current)
        throw new Conflict(
          "Newer durable revision exists. Reload before editing; your unsaved changes have not been overwritten.",
        );
      for (const a of state.assets)
        if (a.kind !== "url") {
          const media = this.media(a.id);
          if (
            !media ||
            media.production_id !== a.projectId ||
            media.state !== "ready" ||
            !this.verifyMedia(media)
          )
            throw Error("Managed media is not preserved: " + a.id);
        }
      for (const table of [
        "wires",
        "nodes",
        "shot_order",
        "boards",
        "shots",
        "productions",
        "collections",
      ])
        this.db.prepare(`DELETE FROM ${table}`).run();
      for (const p of state.projects) {
        const { shotOrder, ...data } = p;
        this.db
          .prepare("INSERT INTO productions VALUES (?,?)")
          .run(p.id, JSON.stringify(data));
      }
      for (const s of state.shots)
        this.db
          .prepare("INSERT INTO shots VALUES (?,?,?)")
          .run(s.id, s.productionId, JSON.stringify(s));
      for (const p of state.projects)
        p.shotOrder.forEach((s, i) =>
          this.db
            .prepare("INSERT INTO shot_order VALUES (?,?,?)")
            .run(p.id, i, s),
        );
      for (const b of state.boards) {
        const { nodes, wires, ...data } = b;
        this.db
          .prepare("INSERT INTO boards VALUES (?,?,?)")
          .run(b.id, b.projectId, JSON.stringify(data));
        nodes.forEach((n, i) =>
          this.db
            .prepare("INSERT INTO nodes VALUES (?,?,?,?,?,?)")
            .run(
              b.id,
              n.id,
              b.projectId,
              n.kind === "placement" ? n.shotId : null,
              i,
              JSON.stringify(n),
            ),
        );
        wires.forEach((w, i) =>
          this.db
            .prepare("INSERT INTO wires VALUES (?,?,?,?,?,?)")
            .run(b.id, w.id, w.fromId, w.toId, i, JSON.stringify(w)),
        );
      }
      for (const key of [
        "characters",
        "worlds",
        "scripts",
        "assets",
        "resources",
        "links",
        "notes",
        "workflowTemplates",
      ] as const)
        this.db
          .prepare("INSERT INTO collections VALUES (?,?)")
          .run(key, JSON.stringify(state[key]));
      this.db.prepare("UPDATE meta SET revision=revision+1").run();
      return { revision: current + 1, state };
    })();
  }
  media(mediaId: string) {
    return this.db.prepare("SELECT * FROM media WHERE id=?").get(mediaId) as
      | MediaRow
      | undefined;
  }
  allMedia() {
    return this.db
      .prepare("SELECT * FROM media ORDER BY id")
      .all() as MediaRow[];
  }
  verifyMedia(m: MediaRow) {
    try {
      const bytes = fs.readFileSync(inside(this.root, m.relative_path));
      return bytes.length === m.size && hash(bytes) === m.sha256;
    } catch {
      return false;
    }
  }
  verifyReadyMedia() {
    for (const m of this.allMedia())
      if (m.state === "ready" && !this.verifyMedia(m))
        this.db
          .prepare("UPDATE media SET state='error',error=? WHERE id=?")
          .run("Managed file missing or checksum mismatch", m.id);
  }
  // No filesystem write is represented as committed media until its final bytes verify.
  stageMedia(
    mediaId: string,
    productionId: string,
    mime: string,
    bytes: Buffer,
    failAt?: "write" | "rename" | "finalize",
  ) {
    id.parse(mediaId);
    id.parse(productionId);
    if (
      !this.db
        .prepare("SELECT id FROM productions WHERE id=?")
        .get(productionId)
    )
      throw Error("Save Production before adding media");
    if (this.media(mediaId)) throw Error("Media ID already exists");
    const sha = hash(bytes),
      stage = `staging/${randomUUID()}.part`,
      relative = `productions/${productionId}/media/${mediaId}`;
    this.db
      .prepare("INSERT INTO media VALUES (?,?,?,?,?,?,?,?,NULL)")
      .run(
        mediaId,
        productionId,
        relative,
        stage,
        sha,
        bytes.length,
        mime,
        "staged",
      );
    try {
      if (failAt === "write") throw Error("Simulated media write failure");
      const staging = inside(this.root, stage);
      const fd = fs.openSync(staging, "wx");
      try {
        fs.writeFileSync(fd, bytes);
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      if (hash(fs.readFileSync(staging)) !== sha)
        throw Error("Staged checksum mismatch");
      this.db
        .prepare("UPDATE media SET state='finalizing' WHERE id=?")
        .run(mediaId);
      if (failAt === "rename") throw Error("Simulated media rename failure");
      fs.mkdirSync(path.dirname(inside(this.root, relative)), {
        recursive: true,
      });
      fs.renameSync(staging, inside(this.root, relative));
      if (failAt === "finalize") throw Error("Simulated finalization failure");
      if (!this.verifyMedia(this.media(mediaId)!))
        throw Error("Final media verification failed");
      this.db
        .prepare("UPDATE media SET state='ready',error=NULL WHERE id=?")
        .run(mediaId);
      return this.media(mediaId)!;
    } catch (e) {
      this.db
        .prepare("UPDATE media SET state='error',error=? WHERE id=?")
        .run(String(e), mediaId);
      throw e;
    }
  }
  // Explicit recovery only. Neither stage files nor failed final files are deleted.
  recoverMedia(mediaId: string) {
    const m = this.media(mediaId);
    if (!m) throw Error("Unknown media");
    if (!this.verifyMedia(m)) {
      const stage = inside(this.root, m.stage_path);
      const bytes = fs.readFileSync(stage);
      if (bytes.length !== m.size || hash(bytes) !== m.sha256)
        throw Error("Cannot recover: staged checksum mismatch");
      const final = inside(this.root, m.relative_path);
      if (fs.existsSync(final))
        throw Error(
          "Final file exists but differs; manual inspection required",
        );
      fs.mkdirSync(path.dirname(final), { recursive: true });
      fs.renameSync(stage, final);
    }
    if (!this.verifyMedia(m)) throw Error("Recovery verification failed");
    this.db
      .prepare("UPDATE media SET state='ready',error=NULL WHERE id=?")
      .run(mediaId);
    return this.media(mediaId)!;
  }
}
