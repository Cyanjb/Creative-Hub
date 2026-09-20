import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const repo = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
function canonical(p: string): string {
  let cursor = path.resolve(p);
  const suffix: string[] = [];
  while (!fs.existsSync(cursor)) {
    suffix.unshift(path.basename(cursor));
    const parent = path.dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return path.resolve(fs.realpathSync(cursor), ...suffix);
}
export function storageRoot(value = process.env.CREATIVE_HUB_STORAGE_ROOT) {
  const root = canonical(
    value ||
      path.join(
        process.env.LOCALAPPDATA || path.join(os.homedir(), ".local", "share"),
        "CreativeHub",
        "v2-foundation",
      ),
  );
  for (const forbidden of [
    repo,
    path.join(os.homedir(), "Creative Hub"),
    path.join(os.homedir(), "Creative-Hub-Preservation"),
  ]) {
    const rel = path.relative(canonical(forbidden), root);
    if (
      !rel ||
      (!rel.startsWith(".." + path.sep) &&
        rel !== ".." &&
        !path.isAbsolute(rel))
    )
      throw Error(
        "Managed storage must be outside source and preservation folders",
      );
  }
  return root;
}
export function inside(root: string, relative: string) {
  const target = path.resolve(root, relative);
  const rel = path.relative(root, target);
  if (
    !rel ||
    rel.startsWith(".." + path.sep) ||
    rel === ".." ||
    path.isAbsolute(rel)
  )
    throw Error("Path escapes managed root");
  const resolved = canonical(target);
  const realRel = path.relative(canonical(root), resolved);
  if (
    realRel.startsWith(".." + path.sep) ||
    realRel === ".." ||
    path.isAbsolute(realRel)
  )
    throw Error("Symlink escapes managed root");
  return target;
}
