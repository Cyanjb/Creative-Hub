import { Repository } from "./storage/repository";
import { fixture } from "../tests/fixtures/foundation";
import { makeAsset } from "../src/lib/factories";
export function seedSynthetic(repo: Repository) {
  if (repo.read().revision !== 0 || repo.read().state.projects.length)
    throw Error("Synthetic seed requires an empty V2 database");
  repo.save({ revision: 0, state: fixture() });
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZQAAAABJRU5ErkJggg==",
    "base64",
  );
  repo.stageMedia("synthetic-image", "production-demo", "image/png", bytes);
  const s = repo.read().state;
  s.assets.push({
    ...makeAsset("production-demo"),
    id: "synthetic-image",
    name: "Synthetic pixel",
    width: 1,
    height: 1,
  });
  const n = s.boards[0].nodes.find((n) => n.id === "image");
  if (n?.kind === "image") n.assetId = "synthetic-image";
  return repo.save({ revision: 1, state: s });
}
