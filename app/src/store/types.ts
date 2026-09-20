/**
 * Creative Hub — core data model.
 *
 * Everything the app knows lives in one `HubState` tree. Projects own boards
 * and the "story ecosystem" (characters, worlds, scripts, assets, notes) so
 * that a character described once is resolvable from every board in the
 * project. See `lib/contextResolver.ts` for how that follow-through works.
 */

export type WireType = 'image' | 'video' | 'text';

export const WIRE_COLORS: Record<WireType, string> = {
  image: '#ffffff',
  video: '#a855f7',
  text: '#facc15',
};

export const WIRE_LABELS: Record<WireType, string> = {
  image: 'Image',
  video: 'Video',
  text: 'Text',
};

export type BoardKind = 'whiteboard' | 'storyboard' | 'pipeline';
export type ViewMode = 'whiteboard' | 'storyboard';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface NodeBase {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  z: number;
  tags: string[];
}

export interface PromptBlock {
  id: string;
  label: string;
  text: string;
  /** Which tool this prompt is written for — drives the enhancer's house style. */
  target: 'image' | 'video' | 'text' | 'audio';
}

/**
 * A Frame is the structured shot unit — the thing that appears as a card on
 * the whiteboard AND as a cell in the storyboard grid. Exactly one primary
 * image slot, by design.
 */
export interface FrameNode extends NodeBase {
  kind: 'frame';
  title: string;
  subtitle: string;
  /** Scene name — storyboard view groups frames by this. */
  scene: string;
  shot: string;
  /** The single primary image slot. Null = empty or icon-only mode. */
  imageAssetId: string | null;
  iconOnly: boolean;
  icon: string;
  prompts: PromptBlock[];
  notes: string;
  description: string;
  audio: string;
  video: string;
  /** Ecosystem links — resolved into full descriptions at prompt time. */
  characterIds: string[];
  worldIds: string[];
  collapsed: { prompts: boolean; notes: boolean; meta: boolean };
}

export interface ImageNode extends NodeBase {
  kind: 'image';
  assetId: string | null;
  /** Direct URL fallback when the image came from "Add Image (URL)". */
  src: string | null;
  caption: string;
}

export interface TextNode extends NodeBase {
  kind: 'text';
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
}

export type BoardNode = FrameNode | ImageNode | TextNode;

export interface Wire {
  id: string;
  fromId: string;
  toId: string;
  type: WireType;
  label: string;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  kind: BoardKind;
  viewMode: ViewMode;
  camera: Camera;
  showGrid: boolean;
  snapToGrid: boolean;
  nodes: BoardNode[];
  wires: Wire[];
  createdAt: number;
  updatedAt: number;
}

/** A character-bible entry. Fields chosen to feed image-prompt generation. */
export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  /** One-line hook used in compact contexts like the carousel. */
  logline: string;
  age: string;
  appearance: string;
  wardrobe: string;
  personality: string;
  backstory: string;
  voice: string;
  arc: string;
  /** Locked visual description — the canonical string injected into prompts. */
  signature: string;
  portraitAssetId: string | null;
  sheetAssetIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface WorldEntry {
  id: string;
  projectId: string;
  name: string;
  /** location | faction | technology | culture | era | rule | prop */
  category: string;
  summary: string;
  description: string;
  /** Visual/atmospheric shorthand injected into image prompts. */
  visualKeys: string;
  rules: string;
  assetIds: string[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ScriptScene {
  id: string;
  heading: string;
  action: string;
  dialogue: string;
  notes: string;
}

export interface Script {
  id: string;
  projectId: string;
  title: string;
  logline: string;
  genre: string;
  tone: string;
  /** Free-form treatment / outline above the scene list. */
  treatment: string;
  scenes: ScriptScene[];
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** Any uploaded or linked image. Blob bytes live in IndexedDB, not here. */
export interface Asset {
  id: string;
  projectId: string;
  name: string;
  /** Present for URL-sourced images; IndexedDB-backed assets resolve lazily. */
  url: string | null;
  mime: string;
  width: number;
  height: number;
  kind: 'upload' | 'url' | 'generated';
  /** e.g. "character-sheet", "setting", "reference" */
  category: string;
  tags: string[];
  createdAt: number;
}

export interface Resource {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
}

export interface LinkItem {
  id: string;
  projectId: string;
  title: string;
  url: string;
  tags: string[];
  createdAt: number;
}

export interface NoteItem {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** A reusable saved workflow — a set of frames + wires captured from a board. */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: BoardNode[];
  wires: Wire[];
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  /** Accent hue used on the hub card. */
  color: string;
  createdAt: number;
  updatedAt: number;
}

export interface HubState {
  projects: Project[];
  boards: Board[];
  characters: Character[];
  worlds: WorldEntry[];
  scripts: Script[];
  assets: Asset[];
  resources: Resource[];
  links: LinkItem[];
  notes: NoteItem[];
  workflowTemplates: WorkflowTemplate[];
}

export const EMPTY_STATE: HubState = {
  projects: [],
  boards: [],
  characters: [],
  worlds: [],
  scripts: [],
  assets: [],
  resources: [],
  links: [],
  notes: [],
  workflowTemplates: [],
};
