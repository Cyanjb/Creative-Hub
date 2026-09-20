import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Repository } from "../server/storage/repository";
import { seedSynthetic } from "../server/seedSynthetic";
process.env.CREATIVE_HUB_STORAGE_ROOT = fs.mkdtempSync(
  path.join(os.tmpdir(), "creative-hub-browser-"),
);
process.env.PORT = "8788";
const repo = new Repository();
seedSynthetic(repo);
repo.close();
await import("../server/index.js");
