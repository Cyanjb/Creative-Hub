import { uid, now } from './id';
import type {
  Asset,
  Board,
  BoardKind,
  Character,
  FrameNode,
  ImageNode,
  LinkItem,
  NoteItem,
  Project,
  PromptBlock,
  Resource,
  Script,
  ScriptScene,
  TextNode,
  WorldEntry,
} from '../store/types';

export const FRAME_W = 340;
export const FRAME_H = 430;

export function makePrompt(partial: Partial<PromptBlock> = {}): PromptBlock {
  return {
    id: uid('pr'),
    label: partial.label ?? 'Image prompt',
    text: partial.text ?? '',
    target: partial.target ?? 'image',
  };
}

export function makeFrame(x: number, y: number, partial: Partial<FrameNode> = {}): FrameNode {
  return {
    kind: 'frame',
    id: uid('fr'),
    x,
    y,
    w: FRAME_W,
    h: FRAME_H,
    rotation: 0,
    z: 0,
    tags: [],
    title: 'Planning Frame',
    subtitle: '',
    scene: 'Scene 1',
    shot: '',
    imageAssetId: null,
    iconOnly: false,
    icon: '🎬',
    prompts: [makePrompt({ label: 'Image prompt', target: 'image' })],
    notes: '',
    description: '',
    audio: '',
    video: '',
    characterIds: [],
    worldIds: [],
    collapsed: { prompts: false, notes: true, meta: true },
    ...partial,
  };
}

export function makeImageNode(x: number, y: number, partial: Partial<ImageNode> = {}): ImageNode {
  return {
    kind: 'image',
    id: uid('im'),
    x,
    y,
    w: 320,
    h: 200,
    rotation: 0,
    z: 0,
    tags: [],
    assetId: null,
    src: null,
    caption: '',
    ...partial,
  };
}

export function makeTextNode(x: number, y: number, partial: Partial<TextNode> = {}): TextNode {
  return {
    kind: 'text',
    id: uid('tx'),
    x,
    y,
    w: 260,
    h: 90,
    rotation: 0,
    z: 0,
    tags: [],
    text: 'Double-click to edit',
    fontSize: 18,
    color: '#e8ecf4',
    bold: false,
    ...partial,
  };
}

export function makeBoard(projectId: string, name: string, kind: BoardKind): Board {
  const t = now();
  return {
    id: uid('bd'),
    projectId,
    name,
    kind,
    viewMode: kind === 'storyboard' ? 'storyboard' : 'whiteboard',
    camera: { x: 120, y: 120, zoom: 0.75 },
    showGrid: true,
    snapToGrid: false,
    nodes: [],
    wires: [],
    createdAt: t,
    updatedAt: t,
  };
}

const PROJECT_COLORS = ['#22d3ee', '#f0abfc', '#a855f7', '#facc15', '#34d399', '#fb7185'];

export function makeProject(name: string, description = ''): Project {
  const t = now();
  return {
    id: uid('pj'),
    name,
    description,
    shotOrder: [],
    color: PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
    createdAt: t,
    updatedAt: t,
  };
}

export function makeCharacter(projectId: string, partial: Partial<Character> = {}): Character {
  const t = now();
  return {
    id: uid('ch'),
    projectId,
    name: 'New Character',
    role: '',
    logline: '',
    age: '',
    appearance: '',
    wardrobe: '',
    personality: '',
    backstory: '',
    voice: '',
    arc: '',
    signature: '',
    portraitAssetId: null,
    sheetAssetIds: [],
    tags: [],
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}

export function makeWorld(projectId: string, partial: Partial<WorldEntry> = {}): WorldEntry {
  const t = now();
  return {
    id: uid('wd'),
    projectId,
    name: 'New Location',
    category: 'location',
    summary: '',
    description: '',
    visualKeys: '',
    rules: '',
    assetIds: [],
    tags: [],
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}

export function makeScene(partial: Partial<ScriptScene> = {}): ScriptScene {
  return {
    id: uid('sc'),
    heading: 'INT. LOCATION — DAY',
    action: '',
    dialogue: '',
    notes: '',
    ...partial,
  };
}

export function makeScript(projectId: string, partial: Partial<Script> = {}): Script {
  const t = now();
  return {
    id: uid('sp'),
    projectId,
    title: 'Untitled Script',
    logline: '',
    genre: '',
    tone: '',
    treatment: '',
    scenes: [makeScene()],
    tags: [],
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}

export function makeAsset(projectId: string, partial: Partial<Asset> = {}): Asset {
  return {
    id: uid('as'),
    projectId,
    name: 'image',
    url: null,
    mime: 'image/png',
    width: 0,
    height: 0,
    kind: 'upload',
    category: 'reference',
    tags: [],
    createdAt: now(),
    ...partial,
  };
}

export function makeResource(projectId: string, partial: Partial<Resource> = {}): Resource {
  return {
    id: uid('rs'),
    projectId,
    title: 'New resource',
    body: '',
    tags: [],
    createdAt: now(),
    ...partial,
  };
}

export function makeLink(projectId: string, partial: Partial<LinkItem> = {}): LinkItem {
  return {
    id: uid('lk'),
    projectId,
    title: 'New link',
    url: '',
    tags: [],
    createdAt: now(),
    ...partial,
  };
}

export function makeNote(projectId: string, partial: Partial<NoteItem> = {}): NoteItem {
  const t = now();
  return {
    id: uid('nt'),
    projectId,
    title: 'New note',
    body: '',
    tags: [],
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}
