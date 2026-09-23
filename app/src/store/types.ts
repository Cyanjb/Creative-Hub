import type { z } from "zod";
import * as s from "../../shared/v2Schema";
export type {
  HubState,
  Shot,
  FrameNode,
  Board,
  BoardNode,
  RenderBoard,
} from "../../shared/v2Schema";
export type Production = z.infer<typeof s.productionSchema>;
/** Existing UI name for a V2 Production, not a separate domain type. */
export type Project = Production;
export type PromptBlock = z.infer<typeof s.promptSchema>;
export type ImageNode = z.infer<typeof s.imageSchema>;
export type TextNode = z.infer<typeof s.textSchema>;
export type Wire = z.infer<typeof s.wireSchema>;
export type Character = z.infer<typeof s.characterSchema>;
export type WorldEntry = z.infer<typeof s.worldSchema>;
export type Script = z.infer<typeof s.scriptSchema>;
export type ScriptScene = z.infer<typeof s.sceneSchema>;
export type Asset = z.infer<typeof s.assetSchema>;
export type Resource = z.infer<typeof s.resourceSchema>;
export type LinkItem = z.infer<typeof s.linkSchema>;
export type NoteItem = z.infer<typeof s.noteSchema>;
export type WorkflowTemplate = z.infer<typeof s.templateSchema>;
export type BoardKind = s.Board["kind"];
export type ViewMode = s.Board["viewMode"];
export type Camera = s.Board["camera"];
export type NodeBase = z.infer<typeof s.layoutSchema>;
export type WireType = Wire["type"];
export const WIRE_COLORS: Record<WireType, string> = {
  image: "#ffffff",
  video: "#a855f7",
  text: "#facc15",
};
export const WIRE_LABELS: Record<WireType, string> = {
  image: "Image",
  video: "Video",
  text: "Text",
};
export const EMPTY_STATE = s.emptyState();
