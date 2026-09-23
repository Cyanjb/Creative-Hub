import { create } from 'zustand';
import { EMPTY_STATE } from './types';
import type {
  Asset,
  Board,
  BoardNode,
  Camera,
  Character,
  FrameNode,
  HubState,
  LinkItem,
  NoteItem,
  Project,
  Resource,
  Script,
  ViewMode,
  Wire,
  WireType,
  WorkflowTemplate,
  WorldEntry,
} from './types';
import { uid, now } from '../lib/id';
import {
  makeBoard,
  makeCharacter,
  makeLink,
  makeNote,
  makeProject,
  makeResource,
  makeScript,
  makeWorld,
} from '../lib/factories';
import { buildTemplate, type TemplateId } from '../lib/boardTemplates';
import { deleteBlob, forgetAssetUrl } from './assetDb';

import {durableState,loadSnapshot,saveSnapshot,SaveCoordinator} from '../lib/v2Persistence';
import {editFrame,frameView,promoteFrame,placeShot,duplicateShot,reorderShots} from '../../shared/v2Domain';
const AUTOSAVE_MS=500;

export type SaveStatus = 'idle' | 'pending' | 'saved' | 'error';

interface Ephemeral {
  loaded:boolean;
  loadError:string|null;
  saveError:string|null;
  mediaErrors:string[];
  revision:number;
  activeProjectId: string | null;
  activeBoardId: string | null;
  selection: string[];
  editingNodeId: string | null;
  lastSavedAt: number;
  saveStatus: SaveStatus;
  /** Wire currently being dragged from a port, if any. */
  pendingWire: { fromId: string; type: WireType } | null;
  wireType: WireType;
  selectedWireId: string | null;
  searchOpen: boolean;
  sidebarOpen: boolean;
  carouselOpen: boolean;
  /** Which full-screen panel is over the board, if any. */
  overlay: 'bible' | 'world' | 'script' | 'integrations' | 'templates' | null;
}

interface Actions {
  initialize:()=>Promise<void>;
  promoteFrame:(boardId:string,nodeId:string)=>void;
  placeShot:(boardId:string,shotId:string)=>void;
  duplicateShot:(shotId:string)=>void;
  reorderShots:(productionId:string,order:string[])=>void;

  // projects
  createProject: (name: string, description?: string) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  openProject: (id: string | null) => void;

  // boards
  createBoard: (projectId: string, name: string, template: TemplateId) => Board;
  updateBoard: (id: string, patch: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  openBoard: (id: string | null) => void;
  setCamera: (boardId: string, cam: Camera) => void;
  setViewMode: (boardId: string, mode: ViewMode) => void;

  // nodes
  addNode: (boardId: string, node: BoardNode) => void;
  addNodes: (boardId: string, nodes: BoardNode[]) => void;
  updateNode: (boardId: string, nodeId: string, patch: Partial<BoardNode>) => void;
  updateFrame: (boardId: string, nodeId: string, patch: Partial<FrameNode>) => void;
  deleteNodes: (boardId: string, nodeIds: string[]) => void;
  duplicateNodes: (boardId: string, nodeIds: string[]) => void;
  bringToFront: (boardId: string, nodeId: string) => void;

  // wires
  addWire: (boardId: string, fromId: string, toId: string, type: WireType) => void;
  deleteWire: (boardId: string, wireId: string) => void;
  updateWire: (boardId: string, wireId: string, patch: Partial<Wire>) => void;

  // ecosystem
  addCharacter: (projectId: string, patch?: Partial<Character>) => Character;
  updateCharacter: (id: string, patch: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addWorld: (projectId: string, patch?: Partial<WorldEntry>) => WorldEntry;
  updateWorld: (id: string, patch: Partial<WorldEntry>) => void;
  deleteWorld: (id: string) => void;
  addScript: (projectId: string, patch?: Partial<Script>) => Script;
  updateScript: (id: string, patch: Partial<Script>) => void;
  deleteScript: (id: string) => void;

  // assets & panel items
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, patch: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addResource: (projectId: string, patch?: Partial<Resource>) => Resource;
  updateResource: (id: string, patch: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  addLink: (projectId: string, patch?: Partial<LinkItem>) => LinkItem;
  updateLink: (id: string, patch: Partial<LinkItem>) => void;
  deleteLink: (id: string) => void;
  addNote: (projectId: string, patch?: Partial<NoteItem>) => NoteItem;
  updateNote: (id: string, patch: Partial<NoteItem>) => void;
  deleteNote: (id: string) => void;

  // workflow templates
  saveWorkflowTemplate: (name: string, description: string, boardId: string, nodeIds: string[]) => void;
  applyWorkflowTemplate: (templateId: string, boardId: string, at: { x: number; y: number }) => void;
  deleteWorkflowTemplate: (id: string) => void;

  // ui
  setSelection: (ids: string[]) => void;
  toggleSelection: (id: string, additive: boolean) => void;
  setEditingNode: (id: string | null) => void;
  setPendingWire: (w: Ephemeral['pendingWire']) => void;
  setWireType: (t: WireType) => void;
  setSelectedWire: (id: string | null) => void;
  setSearchOpen: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
  setCarouselOpen: (v: boolean) => void;
  setOverlay: (v: Ephemeral['overlay']) => void;

  // persistence
  flushSave: () => Promise<void>;
  importState: (state: HubState) => void;
  resetAll: () => void;
}

export type Store = HubState & Ephemeral & Actions;

// ── autosave: debounced 5s, as specified ─────────────────────────────────

let saveTimer:ReturnType<typeof setTimeout>|null=null;
let coordinator:SaveCoordinator;
let initialization:Promise<void>|null=null;
function scheduleSave(_get:()=>Store,_set:unknown){coordinator.changed();if(saveTimer!==null)clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;void coordinator.flush().catch(()=>{});},AUTOSAVE_MS);}
/** Wrap a state mutation so every write schedules a save. */
function mutate(
  set: (fn: (s: Store) => Partial<Store>) => void,
  get: () => Store,
  fn: (s: Store) => Partial<Store>,
) {
  if(!get().loaded)throw Error('V2 data has not loaded');
  set(fn);
  scheduleSave(get, null);
}

function touchBoard(s: Store, boardId: string, fn: (b: Board) => Board): Partial<Store> {
  return {
    boards: s.boards.map((b) => (b.id === boardId ? { ...fn(b), updatedAt: now() } : b)),
  };
}

export const useStore = create<Store>((set, get) => ({
  ...EMPTY_STATE,
  loaded:false,loadError:null,saveError:null,mediaErrors:[],revision:0,
  initialize:()=>{if(initialization)return initialization;initialization=loadSnapshot().then(({state,revision,mediaErrors})=>{coordinator.revision=revision;set({...state,loaded:true,loadError:null,revision,mediaErrors:mediaErrors.map(m=>m.id+': '+(m.error||m.state))});}).catch(e=>{set({loadError:String(e)});initialization=null;});return initialization;},
  promoteFrame:(boardId,nodeId)=>mutate(set,get,s=>promoteFrame(durableState(s),boardId,nodeId,uid('sh'))),
  placeShot:(boardId,shotId)=>mutate(set,get,s=>placeShot(durableState(s),boardId,shotId,uid('pl'))),
  duplicateShot:(shotId)=>mutate(set,get,s=>duplicateShot(durableState(s),shotId,uid('sh'))),
  reorderShots:(productionId,order)=>mutate(set,get,s=>reorderShots(durableState(s),productionId,order)),

  activeProjectId: null,
  activeBoardId: null,
  selection: [],
  editingNodeId: null,
  lastSavedAt: 0,
  saveStatus: 'idle',
  pendingWire: null,
  wireType: 'image',
  selectedWireId: null,
  searchOpen: false,
  sidebarOpen: true,
  carouselOpen: false,
  overlay: null,

  // ── projects ───────────────────────────────────────────────────────────
  createProject: (name, description = '') => {
    const p = makeProject(name, description);
    mutate(set, get, (s) => ({ projects: [...s.projects, p] }));
    return p;
  },
  updateProject: (id, patch) =>
    mutate(set, get, (s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)),
    })),
  deleteProject: (id) =>
    mutate(set, get, (s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      shots:s.shots.filter(x=>x.productionId!==id),
      boards: s.boards.filter((b) => b.projectId !== id),
      characters: s.characters.filter((c) => c.projectId !== id),
      worlds: s.worlds.filter((w) => w.projectId !== id),
      scripts: s.scripts.filter((x) => x.projectId !== id),
      assets: s.assets.filter((a) => a.projectId !== id),
      resources: s.resources.filter((r) => r.projectId !== id),
      links: s.links.filter((l) => l.projectId !== id),
      notes: s.notes.filter((n) => n.projectId !== id),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
      activeBoardId: null,
    })),
  openProject: (id) => set({ activeProjectId: id, activeBoardId: null, overlay: null }),

  // ── boards ─────────────────────────────────────────────────────────────
  createBoard: (projectId, name, template) => {
    const board = makeBoard(projectId, name, template === 'blank' ? 'whiteboard' : template);
    const t = buildTemplate(template, projectId);
    board.nodes = t.nodes;
    board.wires = t.wires;
    mutate(set, get, (s) => ({
      boards: [...s.boards, board],
      characters: [...s.characters, ...t.characters],
      worlds: [...s.worlds, ...t.worlds],
    }));
    return board;
  },
  updateBoard: (id, patch) => mutate(set, get, (s) => touchBoard(s, id, (b) => ({ ...b, ...patch }))),
  deleteBoard: (id) =>
    mutate(set, get, (s) => ({
      boards: s.boards.filter((b) => b.id !== id),
      activeBoardId: s.activeBoardId === id ? null : s.activeBoardId,
    })),
  openBoard: (id) => set({ activeBoardId: id, selection: [], overlay: null }),
  // Camera changes are constant during a pan — deliberately not autosaved on
  // their own; the next real edit persists them.
  setCamera: (boardId, cam) =>
    mutate(set,get,(s) => ({ boards: s.boards.map((b) => (b.id === boardId ? { ...b, camera: cam } : b)) })),
  setViewMode: (boardId, mode) =>
    mutate(set, get, (s) => touchBoard(s, boardId, (b) => ({ ...b, viewMode: mode }))),

  // ── nodes ──────────────────────────────────────────────────────────────
  addNode: (boardId, node) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => ({
        ...b,
        nodes: [...b.nodes, { ...node, z: b.nodes.length }],
      })),
    ),
  addNodes: (boardId, nodes) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => ({
        ...b,
        nodes: [...b.nodes, ...nodes.map((n, i) => ({ ...n, z: b.nodes.length + i }))],
      })),
    ),
  updateNode: (boardId, nodeId, patch) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => ({
        ...b,
        nodes: b.nodes.map((n) => (n.id === nodeId ? ({ ...n, ...patch } as BoardNode) : n)),
      })),
    ),
  updateFrame:(boardId,nodeId,patch)=>mutate(set,get,s=>editFrame(durableState(s),boardId,nodeId,patch)),
  deleteNodes: (boardId, nodeIds) =>
    mutate(set, get, (s) => ({
      ...touchBoard(s, boardId, (b) => ({
        ...b,
        nodes: b.nodes.filter((n) => !nodeIds.includes(n.id)),
        // Wires to a removed node would render to nowhere.
        wires: b.wires.filter((w) => !nodeIds.includes(w.fromId) && !nodeIds.includes(w.toId)),
      })),
      selection: s.selection.filter((id) => !nodeIds.includes(id)),
    })),
  duplicateNodes: (boardId, nodeIds) =>
    mutate(set, get, (s) => {
      const board = s.boards.find((b) => b.id === boardId);
      if (!board) return {};
      const copies = board.nodes
        .filter((n) => nodeIds.includes(n.id))
        .map((n) => ({ ...n, id: uid(n.kind.slice(0, 2)), x: n.x + 32, y: n.y + 32 }));
      return {
        ...touchBoard(s, boardId, (b) => ({ ...b, nodes: [...b.nodes, ...copies] })),
        selection: copies.map((c) => c.id),
      };
    }),
  bringToFront: (boardId, nodeId) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => {
        const max = b.nodes.reduce((m, n) => Math.max(m, n.z), 0);
        return { ...b, nodes: b.nodes.map((n) => (n.id === nodeId ? { ...n, z: max + 1 } : n)) };
      }),
    ),

  // ── wires ──────────────────────────────────────────────────────────────
  addWire: (boardId, fromId, toId, type) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => {
        if (fromId === toId) return b;
        // One wire per direction per pair — re-dragging swaps the type
        // instead of stacking a second line on top of the first.
        const existing = b.wires.find((w) => w.fromId === fromId && w.toId === toId);
        if (existing) {
          return {
            ...b,
            wires: b.wires.map((w) => (w.id === existing.id ? { ...w, type } : w)),
          };
        }
        return { ...b, wires: [...b.wires, { id: uid('wr'), fromId, toId, type, label: '' }] };
      }),
    ),
  deleteWire: (boardId, wireId) =>
    mutate(set, get, (s) => ({
      ...touchBoard(s, boardId, (b) => ({ ...b, wires: b.wires.filter((w) => w.id !== wireId) })),
      selectedWireId: s.selectedWireId === wireId ? null : s.selectedWireId,
    })),
  updateWire: (boardId, wireId, patch) =>
    mutate(set, get, (s) =>
      touchBoard(s, boardId, (b) => ({
        ...b,
        wires: b.wires.map((w) => (w.id === wireId ? { ...w, ...patch } : w)),
      })),
    ),

  // ── ecosystem ──────────────────────────────────────────────────────────
  addCharacter: (projectId, patch) => {
    const c = makeCharacter(projectId, patch);
    mutate(set, get, (s) => ({ characters: [...s.characters, c] }));
    return c;
  },
  updateCharacter: (id, patch) =>
    mutate(set, get, (s) => ({
      characters: s.characters.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)),
    })),
  deleteCharacter: (id) =>
    mutate(set, get, (s) => ({
      characters: s.characters.filter((c) => c.id !== id),
      shots:s.shots.map(x=>({...x,characterIds:x.characterIds.filter(v=>v!==id)})),
      // Drop dangling links from frames so prompts don't resolve to nothing.
      boards: s.boards.map((b) => ({
        ...b,
        nodes: b.nodes.map((n) =>
          n.kind === 'frame' ? { ...n, characterIds: n.characterIds.filter((x) => x !== id) } : n,
        ),
      })),
    })),

  addWorld: (projectId, patch) => {
    const w = makeWorld(projectId, patch);
    mutate(set, get, (s) => ({ worlds: [...s.worlds, w] }));
    return w;
  },
  updateWorld: (id, patch) =>
    mutate(set, get, (s) => ({
      worlds: s.worlds.map((w) => (w.id === id ? { ...w, ...patch, updatedAt: now() } : w)),
    })),
  deleteWorld: (id) =>
    mutate(set, get, (s) => ({
      worlds: s.worlds.filter((w) => w.id !== id),
      shots:s.shots.map(x=>({...x,worldIds:x.worldIds.filter(v=>v!==id)})),
      boards: s.boards.map((b) => ({
        ...b,
        nodes: b.nodes.map((n) =>
          n.kind === 'frame' ? { ...n, worldIds: n.worldIds.filter((x) => x !== id) } : n,
        ),
      })),
    })),

  addScript: (projectId, patch) => {
    const x = makeScript(projectId, patch);
    mutate(set, get, (s) => ({ scripts: [...s.scripts, x] }));
    return x;
  },
  updateScript: (id, patch) =>
    mutate(set, get, (s) => ({
      scripts: s.scripts.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
    })),
  deleteScript: (id) => mutate(set, get, (s) => ({ scripts: s.scripts.filter((x) => x.id !== id) })),

  // ── assets & panel items ───────────────────────────────────────────────
  addAsset: (asset) => mutate(set, get, (s) => ({ assets: [...s.assets, asset] })),
  updateAsset: (id, patch) =>
    mutate(set, get, (s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
  deleteAsset: (id) => {
    void deleteBlob(id);
    forgetAssetUrl(id);
    mutate(set, get, (s) => ({
      assets: s.assets.filter((a) => a.id !== id),
      shots:s.shots.map(x=>x.imageAssetId===id?{...x,imageAssetId:null}:x),
      worlds:s.worlds.map(w=>({...w,assetIds:w.assetIds.filter(x=>x!==id)})),
      boards: s.boards.map((b) => ({
        ...b,
        nodes: b.nodes.map((n) => {
          if (n.kind === 'frame' && n.imageAssetId === id) return { ...n, imageAssetId: null };
          if (n.kind === 'image' && n.assetId === id) return { ...n, assetId: null };
          return n;
        }),
      })),
      characters: s.characters.map((c) => ({
        ...c,
        portraitAssetId: c.portraitAssetId === id ? null : c.portraitAssetId,
        sheetAssetIds: c.sheetAssetIds.filter((x) => x !== id),
      })),
    }));
  },

  addResource: (projectId, patch) => {
    const r = makeResource(projectId, patch);
    mutate(set, get, (s) => ({ resources: [...s.resources, r] }));
    return r;
  },
  updateResource: (id, patch) =>
    mutate(set, get, (s) => ({
      resources: s.resources.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  deleteResource: (id) =>
    mutate(set, get, (s) => ({ resources: s.resources.filter((r) => r.id !== id) })),

  addLink: (projectId, patch) => {
    const l = makeLink(projectId, patch);
    mutate(set, get, (s) => ({ links: [...s.links, l] }));
    return l;
  },
  updateLink: (id, patch) =>
    mutate(set, get, (s) => ({ links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
  deleteLink: (id) => mutate(set, get, (s) => ({ links: s.links.filter((l) => l.id !== id) })),

  addNote: (projectId, patch) => {
    const n = makeNote(projectId, patch);
    mutate(set, get, (s) => ({ notes: [...s.notes, n] }));
    return n;
  },
  updateNote: (id, patch) =>
    mutate(set, get, (s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    })),
  deleteNote: (id) => mutate(set, get, (s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

  // ── workflow templates ─────────────────────────────────────────────────
  saveWorkflowTemplate: (name, description, boardId, nodeIds) =>
    mutate(set, get, (s) => {
      const board = s.boards.find((b) => b.id === boardId);
      if (!board) return {};
      const nodes = frameView(s,board).nodes.filter((n) => nodeIds.includes(n.id));
      if (!nodes.length) return {};
      // Normalise to origin so the template drops cleanly wherever it lands.
      const minX = Math.min(...nodes.map((n) => n.x));
      const minY = Math.min(...nodes.map((n) => n.y));
      const tpl: WorkflowTemplate = {
        id: uid('wt'),
        name,
        description,
        nodes: nodes.map((n) => {if(n.kind==='frame'){const {shotId,...planning}=n;return {...planning,x:n.x-minX,y:n.y-minY};}return {...n,x:n.x-minX,y:n.y-minY};}),
        wires: board.wires.filter((w) => nodeIds.includes(w.fromId) && nodeIds.includes(w.toId)),
        createdAt: now(),
      };
      return { workflowTemplates: [...s.workflowTemplates, tpl] };
    }),
  applyWorkflowTemplate: (templateId, boardId, at) =>
    mutate(set, get, (s) => {
      const tpl = s.workflowTemplates.find((t) => t.id === templateId);
      if (!tpl) return {};
      // Remap ids so a template can be dropped twice on one board.
      const idMap = new Map<string, string>();
      const nodes = tpl.nodes.map((n) => {
        const nid = uid(n.kind.slice(0, 2));
        idMap.set(n.id, nid);
        return { ...n, id: nid, x: n.x + at.x, y: n.y + at.y };
      });
      const wires = tpl.wires.map((w) => ({
        ...w,
        id: uid('wr'),
        fromId: idMap.get(w.fromId) ?? w.fromId,
        toId: idMap.get(w.toId) ?? w.toId,
      }));
      return {
        ...touchBoard(s, boardId, (b) => ({
          ...b,
          nodes: [...b.nodes, ...nodes],
          wires: [...b.wires, ...wires],
        })),
        selection: nodes.map((n) => n.id),
      };
    }),
  deleteWorkflowTemplate: (id) =>
    mutate(set, get, (s) => ({ workflowTemplates: s.workflowTemplates.filter((t) => t.id !== id) })),

  // ── ui ─────────────────────────────────────────────────────────────────
  setSelection: (ids) => set({ selection: ids, selectedWireId: null }),
  toggleSelection: (id, additive) =>
    set((s) => {
      if (!additive) return { selection: [id], selectedWireId: null };
      return {
        selection: s.selection.includes(id)
          ? s.selection.filter((x) => x !== id)
          : [...s.selection, id],
        selectedWireId: null,
      };
    }),
  setEditingNode: (id) => set({ editingNodeId: id }),
  setPendingWire: (w) => set({ pendingWire: w }),
  setWireType: (t) => set({ wireType: t }),
  setSelectedWire: (id) => set({ selectedWireId: id, selection: [] }),
  setSearchOpen: (v) => set({ searchOpen: v }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setCarouselOpen: (v) => set({ carouselOpen: v }),
  setOverlay: (v) => set({ overlay: v }),

  // ── persistence ────────────────────────────────────────────────────────
  flushSave:()=>{if(saveTimer!==null){clearTimeout(saveTimer);saveTimer=null;}return coordinator.flush();},
  importState:()=>{throw Error('Real-data importing is deferred in V2 foundation');},
  resetAll:()=>{throw Error('Workspace reset is disabled in V2 foundation');},

}));

// Selectors ---------------------------------------------------------------

export const useActiveBoard = (): Board | null => {
  const id = useStore((s) => s.activeBoardId);
  return useStore((s) => s.boards.find((b) => b.id === id) ?? null);
};

export const useActiveProject = (): Project | null => {
  const id = useStore((s) => s.activeProjectId);
  return useStore((s) => s.projects.find((p) => p.id === id) ?? null);
};

/** Don't lose the last few seconds of work when the tab closes. */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    void useStore.getState().flushSave().catch(()=>{});
  });
}

coordinator=new SaveCoordinator(()=>durableState(useStore.getState()),saveSnapshot,(saveStatus,error)=>useStore.setState({saveStatus,saveError:error||null,revision:coordinator.revision,...(saveStatus==='saved'?{lastSavedAt:Date.now()}: {})}));
if(typeof window!=='undefined')window.addEventListener('beforeunload',e=>{if(coordinator.generation!==coordinator.acknowledged){e.preventDefault();e.returnValue='';}});
