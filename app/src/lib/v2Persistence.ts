import {
  stateShape,
  snapshotSchema,
  loadSchema,
  type HubState,
} from "../../shared/v2Schema";
export function durableState(s: HubState): HubState {
  return stateShape.parse(
    Object.fromEntries(
      Object.keys(stateShape.shape).map((k) => [k, (s as any)[k]]),
    ),
  );
}
export async function loadSnapshot() {
  const r = await fetch("/api/v2/state");
  const body = await r.json();
  if (!r.ok) throw Error(body.error || "Load failed");
  return loadSchema.parse(body);
}
export async function saveSnapshot(state: HubState, revision: number) {
  const r = await fetch("/api/v2/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state, revision }),
  });
  const body = await r.json();
  if (!r.ok) throw Error(body.error || "Save failed");
  return snapshotSchema.parse(body);
}
/** A single serialized writer. Acknowledgment applies only to the submitted edit generation. */
export class SaveCoordinator {
  revision = 0;
  generation = 0;
  acknowledged = 0;
  private running: Promise<void> | null = null;
  constructor(
    private read: () => HubState,
    private send: typeof saveSnapshot,
    private status: (
      state: "pending" | "saved" | "error",
      error?: string,
    ) => void,
  ) {}
  changed() {
    this.generation++;
    this.status("pending");
  }
  flush(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }
  private async run() {
    try {
      while (this.acknowledged < this.generation) {
        const target = this.generation;
        const result = await this.send(this.read(), this.revision);
        this.revision = result.revision;
        this.acknowledged = target;
      }
      this.status("saved");
    } catch (e) {
      this.status("error", e instanceof Error ? e.message : String(e));
      throw e;
    }
  }
}
