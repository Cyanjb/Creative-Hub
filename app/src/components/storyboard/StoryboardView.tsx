import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Board, FrameNode } from '../../store/types';
import { useAssetUrl } from '../../lib/useAssetUrl';
import { AutoTextarea, toast } from '../ui/Bits';
import { makeFrame, FRAME_W, FRAME_H } from '../../lib/factories';
import { importImageFile, filesFromDrop } from '../../lib/importImage';
import { IconPlus, IconSparkle } from '../ui/Icons';

/**
 * Structured grid view — 4 across, grouped by scene.
 * Reads the same FrameNodes the whiteboard uses, so edits flow both ways.
 */
export function StoryboardView({
  board,
  onEnhance,
}: {
  board: Board;
  onEnhance: (frameId: string, promptId: string) => void;
}) {
  const addNode = useStore((s) => s.addNode);

  const frames = board.nodes.filter((n): n is FrameNode => n.kind === 'frame');

  // Group by scene, preserving first-appearance order rather than sorting
  // alphabetically — scene order is narrative order.
  const groups: Array<{ scene: string; frames: FrameNode[] }> = [];
  for (const f of frames) {
    const key = f.scene?.trim() || 'Unassigned';
    let g = groups.find((x) => x.scene === key);
    if (!g) {
      g = { scene: key, frames: [] };
      groups.push(g);
    }
    g.frames.push(f);
  }

  const addFrame = () => {
    const lastScene = frames.length ? frames[frames.length - 1].scene : 'Scene 1';
    // Place new frames off the end of the existing whiteboard layout so the
    // two views stay coherent.
    const col = frames.length % 4;
    const row = Math.floor(frames.length / 4);
    addNode(
      board.id,
      makeFrame(col * (FRAME_W + 70), row * (FRAME_H + 90), {
        scene: lastScene,
        shot: String(frames.length + 1),
        title: 'New Shot',
      }),
    );
  };

  let n = 0;

  return (
    <div className="storyboard">
      <div className="sb-head">
        <div>
          <h2>{board.name}</h2>
          <div className="muted" style={{ fontSize: 12.5 }}>
            {frames.length} shot{frames.length === 1 ? '' : 's'} across {groups.length} scene
            {groups.length === 1 ? '' : 's'}
          </div>
        </div>
        <button className="btn btn-primary" onClick={addFrame}>
          <IconPlus size={14} /> Add Frame
        </button>
      </div>

      {!frames.length && (
        <div className="empty">
          <span className="big">▦</span>
          <p>
            No frames yet. Add one here, or switch to Whiteboard view and build the sequence
            spatially — both views share the same shots.
          </p>
          <button className="btn btn-primary" onClick={addFrame}>
            <IconPlus size={14} /> Add the first frame
          </button>
        </div>
      )}

      {groups.map((g) => (
        <div className="scene-group" key={g.scene}>
          <div className="scene-bar">
            <h3>{g.scene}</h3>
            <span className="n">
              {g.frames.length} shot{g.frames.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="sb-grid">
            {g.frames.map((f) => (
              <StoryboardCell key={f.id} frame={f} boardId={board.id} index={++n} onEnhance={onEnhance} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StoryboardCell({
  frame,
  boardId,
  index,
  onEnhance,
}: {
  frame: FrameNode;
  boardId: string;
  index: number;
  onEnhance: (frameId: string, promptId: string) => void;
}) {
  const updateFrame = useStore((s) => s.updateFrame);
  const addAsset = useStore((s) => s.addAsset);
  const assets = useStore((s) => s.assets);
  const selection = useStore((s) => s.selection);
  const setSelection = useStore((s) => s.setSelection);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const [dropping, setDropping] = useState(false);

  const asset = assets.find((a) => a.id === frame.imageAssetId);
  const url = useAssetUrl(frame.imageAssetId, asset?.url ?? null);
  const set = (patch: Partial<FrameNode>) => updateFrame(boardId, frame.id, patch);

  const primary = frame.prompts[0];
  const selected = selection.includes(frame.id);

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropping(false);

    const assetId = e.dataTransfer.getData('application/x-hub-asset');
    if (assetId) {
      set({ imageAssetId: assetId, iconOnly: false });
      return;
    }
    const files = filesFromDrop(e.dataTransfer);
    if (!files.length || !activeProjectId) return;
    try {
      const a = await importImageFile(files[0], activeProjectId);
      addAsset(a);
      set({ imageAssetId: a.id, iconOnly: false });
    } catch {
      toast('Could not import that image', 'err');
    }
  };

  return (
    <div className={`sb-cell ${selected ? 'sel' : ''}`} onClick={() => setSelection([frame.id])}>
      <div
        className={`sb-img ${dropping ? 'drop' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={onDrop}
      >
        <span className="sb-num">{String(index).padStart(2, '0')}</span>
        {frame.iconOnly ? (
          <span style={{ fontSize: 40 }}>{frame.icon || '🎬'}</span>
        ) : url ? (
          <img src={url} alt={frame.title} />
        ) : (
          <div className="slot-empty">
            <span className="ico">⬓</span>
            <span>Drop image</span>
          </div>
        )}
      </div>

      <div className="sb-info">
        <div>
          <input
            className="ghost-input"
            value={frame.title}
            placeholder="Shot title"
            onChange={(e) => set({ title: e.target.value })}
            style={{ fontSize: 13.5, fontWeight: 600 }}
          />
          <input
            className="ghost-input sb-sub"
            value={frame.subtitle}
            placeholder="Shot size · camera move"
            onChange={(e) => set({ subtitle: e.target.value })}
          />
        </div>

        <div className="sb-row">
          <span className="k">Descr</span>
          <div className="v">
            <AutoTextarea
              value={frame.description}
              onChange={(v) => set({ description: v })}
              placeholder="What the audience sees…"
              minRows={1}
            />
          </div>
        </div>

        <div className="sb-row">
          <span className="k">Audio</span>
          <div className="v">
            <AutoTextarea
              value={frame.audio}
              onChange={(v) => set({ audio: v })}
              placeholder="Diegetic sound…"
              minRows={1}
            />
          </div>
        </div>

        <div className="sb-row">
          <span className="k">Video</span>
          <div className="v">
            <AutoTextarea
              value={frame.video}
              onChange={(v) => set({ video: v })}
              placeholder="Camera move, duration…"
              minRows={1}
            />
          </div>
        </div>

        <div>
          <div className="row" style={{ marginBottom: 4 }}>
            <span className="k" style={{ fontSize: 9, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--tx-4)', fontWeight: 700 }}>
              Prompt
            </span>
            <div className="spacer" />
            {primary && (
              <button
                className="btn btn-ghost btn-sm"
                title="Enhance with AI"
                onClick={(e) => {
                  e.stopPropagation();
                  onEnhance(frame.id, primary.id);
                }}
                style={{ padding: 2 }}
              >
                <IconSparkle size={12} />
              </button>
            )}
          </div>
          <div className="sb-prompt">
            {primary?.text ? primary.text : <span className="dim">No prompt written yet.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
