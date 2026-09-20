import { useEffect, useRef, useState } from 'react';
import { useStore } from './store/useStore';
import { HubDashboard } from './components/hub/HubDashboard';
import { Whiteboard } from './components/canvas/Whiteboard';
import { StoryboardView } from './components/storyboard/StoryboardView';
import { RightSidebar } from './components/panels/RightSidebar';
import { AssetCarousel } from './components/panels/AssetCarousel';
import { CharacterBible } from './components/panels/CharacterBible';
import { WorldBuilder } from './components/panels/WorldBuilder';
import { ScriptWriter } from './components/panels/ScriptWriter';
import { IntegrationsPanel } from './components/panels/IntegrationsPanel';
import { TemplatesPanel } from './components/panels/TemplatesPanel';
import { SearchPalette } from './components/panels/SearchPalette';
import { EnhanceModal } from './components/panels/EnhanceModal';
import { WireTypePicker } from './components/canvas/WireLayer';
import { ToastHost, Modal, Field, toast } from './components/ui/Bits';
import {
  IconBack,
  IconBook,
  IconDownload,
  IconFit,
  IconFrame,
  IconGlobe,
  IconGridDots,
  IconImage,
  IconLayers,
  IconPlug,
  IconScript,
  IconSearch,
  IconSidebar,
  IconTemplate,
  IconText,
  IconUsers,
} from './components/ui/Icons';
import { makeFrame, makeImageNode, makeTextNode } from './lib/factories';
import { boundsOf, cameraForRect } from './lib/geometry';
import { importImageUrl, fitCardSize } from './lib/importImage';
import { formatTime } from './lib/id';

// jsPDF + html2canvas are ~700kB and only needed when someone actually exports,
// so they load on demand rather than sitting in the initial bundle.
const loadExporters = () => import('./lib/exportPdf');

export default function App() {
  const activeBoardId = useStore((s) => s.activeBoardId);
  const searchOpen = useStore((s) => s.searchOpen);
  const setSearchOpen = useStore((s) => s.setSearchOpen);

  // Cmd/Ctrl-K anywhere.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!useStore.getState().searchOpen);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [setSearchOpen]);

  return (
    <>
      {activeBoardId ? <BoardView /> : <HubDashboard />}
      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
      <ToastHost />
    </>
  );
}

function BoardView() {
  const state = useStore();
  const board = state.boards.find((b) => b.id === state.activeBoardId);
  const project = state.projects.find((p) => p.id === board?.projectId) ?? null;
  const canvasRef = useRef<HTMLDivElement>(null);

  const [urlModal, setUrlModal] = useState(false);
  const [exportMenu, setExportMenu] = useState(false);
  const [enhance, setEnhance] = useState<{ frameId: string; promptId: string } | null>(null);

  if (!board) return <HubDashboard />;

  const isStory = board.viewMode === 'storyboard';

  /** Drop new nodes near the middle of whatever the user is currently looking at. */
  const centerWorld = () => {
    const el = canvasRef.current;
    const w = el?.clientWidth ?? 1200;
    const h = el?.clientHeight ?? 700;
    return {
      x: (-board.camera.x + w / 2) / board.camera.zoom,
      y: (-board.camera.y + h / 2) / board.camera.zoom,
    };
  };

  const addFrame = () => {
    const c = centerWorld();
    state.addNode(board.id, makeFrame(c.x - 170, c.y - 215));
  };
  const addText = () => {
    const c = centerWorld();
    const n = makeTextNode(c.x - 130, c.y - 45);
    state.addNode(board.id, n);
    state.setSelection([n.id]);
    state.setEditingNode(n.id);
  };

  const fit = () => {
    const el = canvasRef.current;
    const b = boundsOf(board.nodes);
    if (!el || !b) return;
    state.setCamera(board.id, cameraForRect(b, el.clientWidth, el.clientHeight));
  };

  const doExportStoryboard = async () => {
    setExportMenu(false);
    toast('Building storyboard PDF…');
    try {
      const { exportStoryboardPdf } = await loadExporters();
      await exportStoryboardPdf(
        board,
        project,
        state.characters.filter((c) => c.projectId === board.projectId),
      );
      toast('Storyboard PDF saved', 'ok');
    } catch (err) {
      console.error(err);
      toast('Export failed', 'err');
    }
  };

  const doExportCanvas = async () => {
    setExportMenu(false);
    const el = canvasRef.current?.querySelector('.canvas-surface') as HTMLElement | null;
    if (!el) {
      toast('Switch to Whiteboard view to export the canvas', 'err');
      return;
    }
    toast('Rendering canvas…');

    // Frame everything before the capture, then put the view back — the export
    // should show the whole board, not whatever happened to be on screen.
    const restore = board.camera;
    const bounds = boundsOf(board.nodes);
    if (bounds) {
      state.setCamera(board.id, cameraForRect(bounds, el.clientWidth, el.clientHeight));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }

    try {
      const { exportCanvasPdf } = await loadExporters();
      await exportCanvasPdf(board, el);
      toast('Canvas PDF saved', 'ok');
    } catch (err) {
      console.error(err);
      toast(err instanceof Error ? err.message : 'Export failed', 'err');
    } finally {
      if (bounds) state.setCamera(board.id, restore);
    }
  };

  const saveLabel =
    state.saveStatus === 'pending'
      ? 'Saving…'
      : state.saveStatus === 'error'
        ? 'Save failed'
        : state.lastSavedAt
          ? `Saved ${formatTime(state.lastSavedAt)}`
          : 'Not saved yet';

  return (
    <div className="shell">
      {/* ── top bar ── */}
      <div className="topbar">
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => state.openBoard(null)}
          title="Back to the hub"
        >
          <IconBack size={14} /> Hub
        </button>

        <input
          className="ghost-input board-name"
          value={board.name}
          onChange={(e) => state.updateBoard(board.id, { name: e.target.value })}
        />

        <span className="save-pill">
          <span className={`save-dot ${state.saveStatus}`} />
          {saveLabel}
        </span>

        <div className="spacer" />

        {!isStory && <WireTypePicker value={state.wireType} onChange={state.setWireType} />}

        <div className="seg">
          <button
            className={!isStory ? 'on' : ''}
            onClick={() => state.setViewMode(board.id, 'whiteboard')}
          >
            Whiteboard
          </button>
          <button className={isStory ? 'on' : ''} onClick={() => state.setViewMode(board.id, 'storyboard')}>
            Storyboard
          </button>
        </div>

        <button className="btn btn-ghost btn-icon" onClick={() => state.setSearchOpen(true)} title="Search (Ctrl-K)">
          <IconSearch size={16} />
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn" onClick={() => setExportMenu((v) => !v)}>
            <IconDownload size={14} /> Export
          </button>
          {exportMenu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setExportMenu(false)} />
              <div
                className="glass"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 250,
                  borderRadius: 'var(--r)',
                  padding: 5,
                  zIndex: 100,
                  boxShadow: 'var(--shadow-float)',
                  background: 'var(--panel-solid)',
                }}
              >
                <button className="pal-row" onClick={doExportStoryboard}>
                  <span className="pal-main">
                    <b>Storyboard PDF</b>
                    <span>Production sheets, 6 panels per page</span>
                  </span>
                </button>
                <button className="pal-row" onClick={doExportCanvas}>
                  <span className="pal-main">
                    <b>Full canvas PDF</b>
                    <span>The board exactly as laid out</span>
                  </span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          className={`btn btn-ghost btn-icon ${state.sidebarOpen ? 'active' : ''}`}
          onClick={() => state.setSidebarOpen(!state.sidebarOpen)}
          title="Toggle project panel"
        >
          <IconSidebar size={16} />
        </button>
      </div>

      {/* ── body ── */}
      <div className="body-row">
        {/* left toolbar */}
        <div className="toolbar">
          <button className="tool" data-tip="Add Frame" onClick={addFrame}>
            <IconFrame />
          </button>
          <button className="tool" data-tip="Add Image (URL)" onClick={() => setUrlModal(true)}>
            <IconImage />
          </button>
          <button className="tool" data-tip="Add Text" onClick={addText}>
            <IconText />
          </button>
          <button className="tool" data-tip="Templates" onClick={() => state.setOverlay('templates')}>
            <IconTemplate />
          </button>

          <div className="tool-div" />

          <button className="tool" data-tip="Character Bible" onClick={() => state.setOverlay('bible')}>
            <IconUsers />
          </button>
          <button className="tool" data-tip="World Builder" onClick={() => state.setOverlay('world')}>
            <IconGlobe />
          </button>
          <button className="tool" data-tip="Script Room" onClick={() => state.setOverlay('script')}>
            <IconScript />
          </button>
          <button
            className={`tool ${state.carouselOpen ? 'on' : ''}`}
            data-tip="Asset carousel"
            onClick={() => state.setCarouselOpen(!state.carouselOpen)}
          >
            <IconLayers />
          </button>

          <div className="spacer" />

          {!isStory && (
            <>
              <button
                className={`tool ${board.showGrid ? 'on' : ''}`}
                data-tip="Toggle grid"
                onClick={() => state.updateBoard(board.id, { showGrid: !board.showGrid })}
              >
                <IconGridDots />
              </button>
              <button
                className={`tool ${board.snapToGrid ? 'on' : ''}`}
                data-tip="Snap to grid"
                onClick={() => state.updateBoard(board.id, { snapToGrid: !board.snapToGrid })}
              >
                <IconBook />
              </button>
              <button className="tool" data-tip="Fit to content" onClick={fit}>
                <IconFit />
              </button>
            </>
          )}
          <button className="tool" data-tip="Integrations" onClick={() => state.setOverlay('integrations')}>
            <IconPlug />
          </button>
        </div>

        {/* canvas / grid */}
        <div className="canvas-wrap" ref={canvasRef}>
          {isStory ? (
            <StoryboardView
              board={board}
              onEnhance={(frameId, promptId) => setEnhance({ frameId, promptId })}
            />
          ) : (
            <Whiteboard board={board} onEnhance={(frameId, promptId) => setEnhance({ frameId, promptId })} />
          )}

          {!isStory && (
            <div
              style={{
                position: 'absolute',
                left: 12,
                bottom: state.carouselOpen ? 130 : 12,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                zIndex: 30,
                transition: 'bottom 0.16s',
              }}
            >
              <div className="glass" style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11.5, color: 'var(--tx-3)' }}>
                {Math.round(board.camera.zoom * 100)}%
              </div>
              <div className="glass" style={{ borderRadius: 999, padding: '4px 11px', fontSize: 11, color: 'var(--tx-4)' }}>
                Space or middle-drag to pan · Ctrl+wheel to zoom · drag a port to wire
              </div>
            </div>
          )}

          {state.carouselOpen && board.projectId && <AssetCarousel projectId={board.projectId} />}

          {/* overlays live above the canvas but inside the body row */}
          {state.overlay === 'bible' && (
            <CharacterBible projectId={board.projectId} onClose={() => state.setOverlay(null)} />
          )}
          {state.overlay === 'world' && (
            <WorldBuilder projectId={board.projectId} onClose={() => state.setOverlay(null)} />
          )}
          {state.overlay === 'script' && (
            <ScriptWriter projectId={board.projectId} onClose={() => state.setOverlay(null)} />
          )}
          {state.overlay === 'integrations' && <IntegrationsPanel onClose={() => state.setOverlay(null)} />}
          {state.overlay === 'templates' && (
            <TemplatesPanel boardId={board.id} onClose={() => state.setOverlay(null)} />
          )}
        </div>

        {state.sidebarOpen && <RightSidebar projectId={board.projectId} />}
      </div>

      {urlModal && (
        <AddImageUrlModal
          boardId={board.id}
          projectId={board.projectId}
          at={centerWorld()}
          onClose={() => setUrlModal(false)}
        />
      )}

      {enhance && (
        <EnhanceModal
          boardId={board.id}
          frameId={enhance.frameId}
          promptId={enhance.promptId}
          onClose={() => setEnhance(null)}
        />
      )}
    </div>
  );
}

function AddImageUrlModal({
  boardId,
  projectId,
  at,
  onClose,
}: {
  boardId: string;
  projectId: string;
  at: { x: number; y: number };
  onClose: () => void;
}) {
  const addAsset = useStore((s) => s.addAsset);
  const addNode = useStore((s) => s.addNode);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    try {
      const asset = await importImageUrl(u, projectId);
      addAsset(asset);
      const size = fitCardSize(asset.width, asset.height);
      addNode(boardId, makeImageNode(at.x - size.w / 2, at.y - size.h / 2, { assetId: asset.id, src: u, ...size }));
      toast('Image added', 'ok');
      onClose();
    } catch {
      toast('Could not load that URL', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Add image from URL"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit} disabled={busy || !url.trim()}>
            {busy ? <span className="spinner" /> : null} Add image
          </button>
        </>
      }
    >
      <Field
        label="Image URL"
        hint="The image is referenced, not copied — if the source goes away, so does the image."
      >
        <input
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      </Field>
    </Modal>
  );
}
