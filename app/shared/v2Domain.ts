import {
  contentSchema,
  presentationSchema,
  stateSchema,
  type HubState,
  type Board,
  type FrameNode,
  type RenderBoard,
} from "./v2Schema";
function pick(shape: Record<string, unknown>, value: Record<string, unknown>) {
  return Object.fromEntries(Object.keys(shape).map((k) => [k, value[k]]));
}
export function contentOf(value: Record<string, unknown>) {
  return contentSchema.parse(pick(contentSchema.shape, value));
}
export function presentationOf(value: Record<string, unknown>) {
  return presentationSchema.parse(pick(presentationSchema.shape, value));
}
export function frameView(state: HubState, board: Board): RenderBoard {
  return {
    ...board,
    nodes: board.nodes.map((n) => {
      if (n.kind !== "placement") return n;
      const shot = state.shots.find((s) => s.id === n.shotId);
      if (!shot) throw Error("Missing Shot " + n.shotId);
      return { ...contentOf(shot), ...n, kind: "frame" as const };
    }),
  };
}
export function promoteFrame(
  state: HubState,
  boardId: string,
  nodeId: string,
  shotId: string,
): HubState {
  const s = structuredClone(state),
    b = s.boards.find((x) => x.id === boardId)!;
  const n = b.nodes.find((x) => x.id === nodeId);
  if (!n || n.kind !== "frame") throw Error("Select a planning Frame");
  s.shots.push({
    ...contentOf(n),
    id: shotId,
    productionId: b.projectId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  s.projects.find((p) => p.id === b.projectId)!.shotOrder.push(shotId);
  b.nodes = b.nodes.map((x) =>
    x.id === nodeId ? { ...presentationOf(n), kind: "placement", shotId } : x,
  );
  return stateSchema.parse(s);
}
export function editFrame(
  state: HubState,
  boardId: string,
  nodeId: string,
  patch: Partial<FrameNode>,
): HubState {
  const s = structuredClone(state),
    b = s.boards.find((x) => x.id === boardId)!;
  const n = b.nodes.find((x) => x.id === nodeId);
  if (!n) throw Error("Frame not found");
  if (n.kind === "placement") {
    const shot = s.shots.find((x) => x.id === n.shotId)!;
    for (const k of Object.keys(contentSchema.shape))
      if (k in patch) (shot as any)[k] = (patch as any)[k];
    shot.updatedAt = Date.now();
    for (const k of Object.keys(presentationSchema.shape))
      if (k !== "id" && k in patch) (n as any)[k] = (patch as any)[k];
  } else if (n.kind === "frame")
    Object.assign(n, patch, { id: n.id, kind: "frame" });
  else throw Error("Not a Frame");
  return stateSchema.parse(s);
}
export function placeShot(
  state: HubState,
  boardId: string,
  shotId: string,
  placementId: string,
): HubState {
  const s = structuredClone(state),
    b = s.boards.find((x) => x.id === boardId)!;
  b.nodes.push({
    kind: "placement",
    id: placementId,
    shotId,
    x: 60,
    y: 60,
    w: 340,
    h: 430,
    rotation: 0,
    z: b.nodes.length,
    tags: [],
    iconOnly: false,
    icon: "🎬",
    collapsed: { prompts: false, notes: true, meta: true },
  });
  return stateSchema.parse(s);
}
export function duplicateShot(
  state: HubState,
  shotId: string,
  newId: string,
): HubState {
  const s = structuredClone(state),
    original = s.shots.find((x) => x.id === shotId);
  if (!original) throw Error("Shot not found");
  s.shots.push({
    ...structuredClone(original),
    id: newId,
    shot: original.shot + " copy",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  s.projects.find((x) => x.id === original.productionId)!.shotOrder.push(newId);
  return stateSchema.parse(s);
}
export function removeBoard(state: HubState, boardId: string): HubState {
  return stateSchema.parse({
    ...state,
    boards: state.boards.filter((b) => b.id !== boardId),
  });
}
export function removeNodes(
  state: HubState,
  boardId: string,
  nodeIds: string[],
): HubState {
  return stateSchema.parse({
    ...state,
    boards: state.boards.map((b) =>
      b.id !== boardId
        ? b
        : {
            ...b,
            nodes: b.nodes.filter((n) => !nodeIds.includes(n.id)),
            wires: b.wires.filter(
              (w) => !nodeIds.includes(w.fromId) && !nodeIds.includes(w.toId),
            ),
          },
    ),
  });
}
export function duplicatePlacement(
  state: HubState,
  boardId: string,
  nodeId: string,
  newId: string,
): HubState {
  const s = structuredClone(state),
    b = s.boards.find((x) => x.id === boardId)!;
  const n = b.nodes.find((x) => x.id === nodeId);
  if (!n) throw Error("Node missing");
  b.nodes.push({ ...structuredClone(n), id: newId, x: n.x + 32, y: n.y + 32 });
  return stateSchema.parse(s);
}
export function reorderShots(
  state: HubState,
  productionId: string,
  order: string[],
): HubState {
  return stateSchema.parse({
    ...state,
    projects: state.projects.map((p) =>
      p.id === productionId ? { ...p, shotOrder: order } : p,
    ),
  });
}
