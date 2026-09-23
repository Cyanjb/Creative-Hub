import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import type { RenderBoard as Board, BoardNode, FrameNode, ImageNode, TextNode } from '../../store/types';
import {
  boundsOf,
  cameraForRect,
  GRID_SIZE,
  normalizeRect,
  rectsIntersect,
  screenToWorld,
  snap,
  zoomAt,
  type Point,
  type Rect,
} from '../../lib/geometry';
import { FrameCard } from './FrameCard';
import { ImageCardNode } from './ImageCardNode';
import { TextNodeView } from './TextNodeView';
import { WireLayer } from './WireLayer';
import { filesFromDrop, fitCardSize, importImageFile } from '../../lib/importImage';
import { makeImageNode } from '../../lib/factories';
import { toast } from '../ui/Bits';

type Drag =
  | { kind: 'none' }
  | { kind: 'pan'; startX: number; startY: number; camX: number; camY: number }
  | { kind: 'marquee'; from: Point; to: Point }
  | { kind: 'move'; startWorld: Point; origins: Map<string, Point> }
  | { kind: 'resize'; id: string; corner: string; start: Rect; startWorld: Point }
  | { kind: 'rotate'; id: string; cx: number; cy: number; startAngle: number; startRot: number }
  | { kind: 'wire'; fromId: string };

export function Whiteboard({ board, onEnhance }: { board: Board; onEnhance: (frameId: string, promptId: string) => void }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const setCamera = useStore((s) => s.setCamera);
  const updateNode = useStore((s) => s.updateNode);
  const addNode = useStore((s) => s.addNode);
  const addAsset = useStore((s) => s.addAsset);
  const updateFrame = useStore((s) => s.updateFrame);
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const toggleSelection = useStore((s) => s.toggleSelection);
  const bringToFront = useStore((s) => s.bringToFront);
  const pendingWire = useStore((s) => s.pendingWire);
  const setPendingWire = useStore((s) => s.setPendingWire);
  const wireType = useStore((s) => s.wireType);
  const addWire = useStore((s) => s.addWire);
  const setSelectedWire = useStore((s) => s.setSelectedWire);
  const editingNodeId = useStore((s) => s.editingNodeId);
  const setEditingNode = useStore((s) => s.setEditingNode);
  const activeProjectId = useStore((s) => s.activeProjectId);

  const [drag, setDrag] = useState<Drag>({ kind: 'none' });
  const [spaceDown, setSpaceDown] = useState(false);
  const [cursorWorld, setCursorWorld] = useState<Point | null>(null);
  const [dropActive, setDropActive] = useState(false);

  const cam = board.camera;

  const toWorld = useCallback(
    (e: { clientX: number; clientY: number }): Point => {
      const rect = surfaceRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return screenToWorld({ x: e.clientX, y: e.clientY }, cam, rect);
    },
    [cam],
  );

  // ── keyboard: space to pan, delete, duplicate, select-all, fit ─────────
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
    };

    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTyping()) {
        e.preventDefault();
        setSpaceDown(true);
      }
      if (isTyping()) return;

      const st = useStore.getState();
      if ((e.key === 'Delete' || e.key === 'Backspace') && st.selection.length) {
        e.preventDefault();
        st.deleteNodes(board.id, st.selection);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && st.selection.length) {
        e.preventDefault();
        st.duplicateNodes(board.id, st.selection);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        st.setSelection(board.nodes.map((n) => n.id));
      }
      if (e.key === 'Escape') {
        st.setSelection([]);
        st.setSelectedWire(null);
        st.setPendingWire(null);
      }
      if (e.key === '1' && !e.metaKey && !e.ctrlKey) fitToContent();
      if (e.key === '0' && !e.metaKey && !e.ctrlKey) setCamera(board.id, { x: 120, y: 120, zoom: 1 });
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceDown(false);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.id, board.nodes]);

  const fitToContent = useCallback(() => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    const b = boundsOf(board.nodes);
    if (!rect || !b) return;
    setCamera(board.id, cameraForRect(b, rect.width, rect.height));
  }, [board.id, board.nodes, setCamera]);

  // ── wheel: ctrl/cmd zooms; trackpad two-finger pans; mouse wheel zooms ──
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      // A trackpad reports small, often fractional deltas and real deltaX.
      // A mouse wheel reports chunky deltaY with no deltaX.
      const trackpadish = e.deltaX !== 0 || Math.abs(e.deltaY) < 40 || !Number.isInteger(e.deltaY);

      if (e.ctrlKey || e.metaKey) {
        setCamera(board.id, zoomAt(cam, Math.exp(-e.deltaY * 0.01), sx, sy));
      } else if (trackpadish) {
        setCamera(board.id, { ...cam, x: cam.x - e.deltaX, y: cam.y - e.deltaY });
      } else {
        setCamera(board.id, zoomAt(cam, e.deltaY < 0 ? 1.12 : 1 / 1.12, sx, sy));
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [board.id, cam, setCamera]);

  // ── pointer handling ───────────────────────────────────────────────────

  const onSurfacePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || spaceDown || e.altKey) {
      e.preventDefault();
      setDrag({ kind: 'pan', startX: e.clientX, startY: e.clientY, camX: cam.x, camY: cam.y });
      (e.target as Element).setPointerCapture?.(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    // Clicked bare canvas → start a marquee and clear selection.
    const w = toWorld(e);
    setSelection([]);
    setSelectedWire(null);
    setEditingNode(null);
    setDrag({ kind: 'marquee', from: w, to: w });
  };

  const onNodePointerDown = (e: React.PointerEvent, node: BoardNode) => {
    if (e.button !== 0 || spaceDown) return;
    // Let inputs inside a card take the event.
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, button, [data-no-drag]')) return;

    e.stopPropagation();
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const st = useStore.getState();
    const already = st.selection.includes(node.id);
    if (!already || additive) toggleSelection(node.id, additive);
    bringToFront(board.id, node.id);

    const ids = additive || already ? Array.from(new Set([...st.selection, node.id])) : [node.id];
    const origins = new Map<string, Point>();
    for (const id of ids) {
      const n = board.nodes.find((x) => x.id === id);
      if (n) origins.set(id, { x: n.x, y: n.y });
    }
    setDrag({ kind: 'move', startWorld: toWorld(e), origins });
  };

  const onHandlePointerDown = (e: React.PointerEvent, node: BoardNode, corner: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (corner === 'rot') {
      const cx = node.x + node.w / 2;
      const cy = node.y + node.h / 2;
      const w = toWorld(e);
      setDrag({
        kind: 'rotate',
        id: node.id,
        cx,
        cy,
        startAngle: Math.atan2(w.y - cy, w.x - cx),
        startRot: node.rotation,
      });
    } else {
      setDrag({
        kind: 'resize',
        id: node.id,
        corner,
        start: { x: node.x, y: node.y, w: node.w, h: node.h },
        startWorld: toWorld(e),
      });
    }
  };

  const onStartWire = (e: React.PointerEvent, fromId: string) => {
    e.preventDefault();
    setPendingWire({ fromId, type: wireType });
    setDrag({ kind: 'wire', fromId });
  };

  const onFinishWire = (toId: string) => {
    if (pendingWire && pendingWire.fromId !== toId) {
      addWire(board.id, pendingWire.fromId, toId, wireType);
    }
    setPendingWire(null);
    setDrag({ kind: 'none' });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.kind === 'none') return;
    const w = toWorld(e);
    setCursorWorld(w);

    switch (drag.kind) {
      case 'pan':
        setCamera(board.id, {
          ...cam,
          x: drag.camX + (e.clientX - drag.startX),
          y: drag.camY + (e.clientY - drag.startY),
        });
        break;

      case 'marquee':
        setDrag({ ...drag, to: w });
        break;

      case 'move': {
        const dx = w.x - drag.startWorld.x;
        const dy = w.y - drag.startWorld.y;
        for (const [id, o] of drag.origins) {
          updateNode(board.id, id, {
            x: snap(o.x + dx, board.snapToGrid),
            y: snap(o.y + dy, board.snapToGrid),
          });
        }
        break;
      }

      case 'resize': {
        const dx = w.x - drag.startWorld.x;
        const dy = w.y - drag.startWorld.y;
        const s = drag.start;
        let { x, y, w: nw, h: nh } = s;
        const MIN = 90;
        if (drag.corner.includes('e')) nw = Math.max(MIN, s.w + dx);
        if (drag.corner.includes('s')) nh = Math.max(MIN, s.h + dy);
        if (drag.corner.includes('w')) {
          nw = Math.max(MIN, s.w - dx);
          x = s.x + (s.w - nw);
        }
        if (drag.corner.includes('n')) {
          nh = Math.max(MIN, s.h - dy);
          y = s.y + (s.h - nh);
        }
        updateNode(board.id, drag.id, {
          x: snap(x, board.snapToGrid),
          y: snap(y, board.snapToGrid),
          w: snap(nw, board.snapToGrid),
          h: snap(nh, board.snapToGrid),
        });
        break;
      }

      case 'rotate': {
        const a = Math.atan2(w.y - drag.cy, w.x - drag.cx);
        let deg = drag.startRot + ((a - drag.startAngle) * 180) / Math.PI;
        // Shift snaps to 15° so you can get back to square.
        if (e.shiftKey) deg = Math.round(deg / 15) * 15;
        updateNode(board.id, drag.id, { rotation: deg });
        break;
      }
      default:
        break;
    }
  };

  const onPointerUp = () => {
    if (drag.kind === 'marquee') {
      const r = normalizeRect(drag.from, drag.to);
      if (r.w > 4 || r.h > 4) {
        setSelection(board.nodes.filter((n) => rectsIntersect(r, n)).map((n) => n.id));
      }
    }
    if (drag.kind === 'wire') setPendingWire(null);
    setDrag({ kind: 'none' });
  };

  // ── image drop ─────────────────────────────────────────────────────────

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropActive(false);
    if (!activeProjectId) return;

    const world = toWorld(e);

    // Dropping an asset dragged out of the carousel / sidebar.
    const assetId = e.dataTransfer.getData('application/x-hub-asset');
    if (assetId) {
      const slot = (e.target as HTMLElement).closest('[data-image-slot]');
      if (slot) {
        updateFrame(board.id, slot.getAttribute('data-image-slot')!, { imageAssetId: assetId, iconOnly: false });
        return;
      }
      const a = useStore.getState().assets.find((x) => x.id === assetId);
      const size = fitCardSize(a?.width ?? 0, a?.height ?? 0);
      addNode(
        board.id,
        makeImageNode(world.x - size.w / 2, world.y - size.h / 2, {
          assetId,
          src: a?.url ?? null,
          ...size,
        }),
      );
      return;
    }

    // Dropping real files.
    const files = filesFromDrop(e.dataTransfer);
    if (!files.length) return;

    const slot = (e.target as HTMLElement).closest('[data-image-slot]');
    try {
      let i = 0;
      for (const f of files) {
        const asset = await importImageFile(f, activeProjectId);
        addAsset(asset);
        if (slot && i === 0) {
          // First image dropped on a frame locks into its primary slot.
          updateFrame(board.id, slot.getAttribute('data-image-slot')!, {
            imageAssetId: asset.id,
            iconOnly: false,
          });
        } else {
          const size = fitCardSize(asset.width, asset.height);
          addNode(
            board.id,
            makeImageNode(world.x - size.w / 2 + i * 28, world.y - size.h / 2 + i * 28, {
              assetId: asset.id,
              ...size,
            }),
          );
        }
        i++;
      }
      toast(`${files.length} image${files.length > 1 ? 's' : ''} added`, 'ok');
    } catch (err) {
      console.error(err);
      toast('Could not import that image', 'err');
    }
  };

  // ── render ─────────────────────────────────────────────────────────────

  const gridStyle = board.showGrid
    ? {
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.11) 1px, transparent 0)`,
        backgroundSize: `${GRID_SIZE * cam.zoom}px ${GRID_SIZE * cam.zoom}px`,
        backgroundPosition: `${cam.x}px ${cam.y}px`,
      }
    : undefined;

  const marquee =
    drag.kind === 'marquee'
      ? (() => {
          const r = normalizeRect(drag.from, drag.to);
          return {
            left: r.x * cam.zoom + cam.x,
            top: r.y * cam.zoom + cam.y,
            width: r.w * cam.zoom,
            height: r.h * cam.zoom,
          };
        })()
      : null;

  const sorted = [...board.nodes].sort((a, b) => a.z - b.z);

  return (
    <div
      ref={surfaceRef}
      className={`canvas-surface ${drag.kind === 'pan' ? 'panning' : spaceDown ? 'space' : ''}`}
      style={gridStyle}
      onPointerDown={onSurfacePointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onDragOver={(e) => {
        e.preventDefault();
        setDropActive(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDropActive(false);
      }}
      onDrop={onDrop}
    >
      {dropActive && (
        <div
          style={{
            position: 'absolute',
            inset: 10,
            border: '2px dashed var(--cyan)',
            borderRadius: 14,
            background: 'rgba(34,211,238,0.05)',
            pointerEvents: 'none',
            zIndex: 200,
          }}
        />
      )}

      <div
        className="canvas-world"
        style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})` }}
      >
        <WireLayer board={board} dragPoint={drag.kind === 'wire' ? cursorWorld : null} />

        {sorted.map((node) => {
          const sel = selection.includes(node.id);
          return (
            <div
              key={node.id}
              className="node"
              style={{
                left: node.x,
                top: node.y,
                width: node.w,
                height: node.h,
                transform: node.rotation ? `rotate(${node.rotation}deg)` : undefined,
                zIndex: 2 + node.z,
              }}
              onPointerDown={(e) => onNodePointerDown(e, node)}
              onPointerUp={() => {
                if (drag.kind === 'wire' && node.kind === 'frame') onFinishWire(node.id);
              }}
            >
              {node.kind === 'frame' && (
                <FrameCard
                  node={node as FrameNode}
                  boardId={board.id}
                  selected={sel}
                  onStartWire={onStartWire}
                  onFinishWire={onFinishWire}
                  wireArmed={drag.kind === 'wire' && pendingWire?.fromId !== node.id}
                  onEnhance={onEnhance}
                />
              )}
              {node.kind === 'image' && (
                <ImageCardNode node={node as ImageNode} boardId={board.id} selected={sel} />
              )}
              {node.kind === 'text' && (
                <TextNodeView
                  node={node as TextNode}
                  boardId={board.id}
                  selected={sel}
                  editing={editingNodeId === node.id}
                  onEdit={() => setEditingNode(node.id)}
                  onDone={() => setEditingNode(null)}
                />
              )}

              {sel && selection.length === 1 && (
                <>
                  <div className="handle nw" onPointerDown={(e) => onHandlePointerDown(e, node, 'nw')} />
                  <div className="handle ne" onPointerDown={(e) => onHandlePointerDown(e, node, 'ne')} />
                  <div className="handle sw" onPointerDown={(e) => onHandlePointerDown(e, node, 'sw')} />
                  <div className="handle se" onPointerDown={(e) => onHandlePointerDown(e, node, 'se')} />
                  <div className="handle rot" onPointerDown={(e) => onHandlePointerDown(e, node, 'rot')} />
                </>
              )}
            </div>
          );
        })}
      </div>

      {marquee && <div className="marquee" style={marquee} />}
    </div>
  );
}
