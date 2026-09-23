import express from "express";
import { z } from "zod";
import { Repository, Conflict } from "./storage/repository";
import { inside } from "./storage/config";
import { backup } from "./storage/backup";
import { id } from "../shared/v2Schema";
export function v2Routes(repo: Repository) {
  const router = express.Router();
  router.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):5274$/.test(origin)) {
      res.status(403).json({ error: "Untrusted local application origin" });
      return;
    }
    next();
  });
  router.get("/state", (_req, res) => {
    try {
      repo.verifyReadyMedia();
      res.json({
        ...repo.read(),
        mediaErrors: repo
          .allMedia()
          .filter((m) => m.state !== "ready")
          .map((m) => ({ id: m.id, state: m.state, error: m.error })),
      });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
  router.put("/state", (req, res) => {
    try {
      res.json(repo.save(req.body));
    } catch (e) {
      res
        .status(
          e instanceof Conflict ? 409 : e instanceof z.ZodError ? 400 : 500,
        )
        .json({ error: String(e) });
    }
  });
  router.post(
    "/media/:productionId/:id",
    express.raw({ type: "image/*", limit: "25mb" }),
    (req, res) => {
      try {
        if (
          !["image/png", "image/jpeg", "image/webp", "image/gif"].includes(
            req.headers["content-type"] || "",
          )
        )
          throw Error("Unsupported managed image MIME type");
        if (!Buffer.isBuffer(req.body) || !req.body.length)
          throw Error("Image bytes required");
        const row = repo.stageMedia(
          req.params.id,
          req.params.productionId,
          req.headers["content-type"] || "application/octet-stream",
          req.body,
        );
        res
          .status(201)
          .json({
            id: row.id,
            url: `/api/v2/media/${row.id}`,
            sha256: row.sha256,
          });
      } catch (e) {
        res.status(400).json({ error: String(e) });
      }
    },
  );
  router.get("/media/:id", (req, res) => {
    try {
      id.parse(req.params.id);
      const row = repo.media(req.params.id);
      if (!row || row.state !== "ready" || !repo.verifyMedia(row)) {
        repo.verifyReadyMedia();
        res.status(409).json({ error: "Media unavailable or not preserved" });
        return;
      }
      res.setHeader("Content-Type", row.mime);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.sendFile(inside(repo.root, row.relative_path));
    } catch (e) {
      res.status(400).json({ error: String(e) });
    }
  });
  router.post("/backup", async (_req, res) => {
    try {
      res.json({ path: await backup(repo) });
    } catch (e) {
      res.status(500).json({ error: String(e) });
    }
  });
  return router;
}
