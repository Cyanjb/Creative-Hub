import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { FrameNode, PromptBlock } from '../../store/types';
import { WIRE_COLORS } from '../../store/types';
import { useAssetUrl } from '../../lib/useAssetUrl';
import { AutoTextarea, Collapsible } from '../ui/Bits';
import { makePrompt } from '../../lib/factories';
import { IconPlus, IconSparkle, IconTrash, IconX } from '../ui/Icons';

/**
 * The structured shot unit. Same component backs the whiteboard card; the
 * storyboard grid has its own layout but reads the same node.
 */
export function FrameCard({
  node,
  boardId,
  selected,
  onStartWire,
  onFinishWire,
  wireArmed,
  onEnhance,
}: {
  node: FrameNode;
  boardId: string;
  selected: boolean;
  onStartWire: (e: React.PointerEvent, fromId: string) => void;
  onFinishWire: (toId: string) => void;
  wireArmed: boolean;
  onEnhance: (frameId: string, promptId: string) => void;
}) {
  const updateFrame = useStore((s) => s.updateFrame);
  const wireType = useStore((s) => s.wireType);
  const characters = useStore((s) => s.characters);
  const assets = useStore((s) => s.assets);
  const [dropping, setDropping] = useState(false);

  const asset = assets.find((a) => a.id === node.imageAssetId);
  const imgUrl = useAssetUrl(node.imageAssetId, asset?.url ?? null);

  const set = (patch: Partial<FrameNode>) => updateFrame(boardId, node.id, patch);

  const linkedChars = characters.filter((c) => node.characterIds.includes(c.id));

  const updatePrompt = (pid: string, patch: Partial<PromptBlock>) =>
    set({ prompts: node.prompts.map((p) => (p.id === pid ? { ...p, ...patch } : p)) });

  // Image slot height scales with the card so the card stays balanced when
  // resized. Clamped so it never eats the whole frame or vanishes.
  const slotH = node.iconOnly ? 118 : Math.max(96, Math.min(node.h * 0.44, node.h - 190));

  return (
    <div className="frame" data-testid={`frame-${node.id}`}>
      <div className="v2-frame-role">{node.shotId?'Shot placement':'Planning Frame'} {!node.shotId&&<button onClick={()=>useStore.getState().promoteFrame(boardId,node.id)}>Make Shot</button>}</div>
      {/* ── ports ── */}
      <div
        className={`port in ${wireArmed ? 'armed' : ''}`}
        style={{ ['--port-c' as string]: WIRE_COLORS[wireType] }}
        title="Input"
        onPointerUp={(e) => {
          e.stopPropagation();
          onFinishWire(node.id);
        }}
      />
      <div
        className="port out"
        style={{ ['--port-c' as string]: WIRE_COLORS[wireType] }}
        title="Drag to connect"
        onPointerDown={(e) => {
          e.stopPropagation();
          onStartWire(e, node.id);
        }}
      />

      {/* ── header ── */}
      <div className="frame-head" data-drag-handle>
        <div className="frame-badge">
          <input
            className="ghost-input frame-scene"
            value={node.scene}
            placeholder="Scene"
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => set({ scene: e.target.value })}
            style={{ flex: 1, minWidth: 0 }}
          />
          <input
            className="ghost-input frame-shot"
            value={node.shot}
            placeholder="#"
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => set({ shot: e.target.value })}
            style={{ width: 34, textAlign: 'center', flex: '0 0 auto' }}
          />
        </div>
        <input
          className="ghost-input frame-title"
          value={node.title}
          placeholder="Shot title"
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => set({ title: e.target.value })}
        />
        <input
          className="ghost-input frame-subtitle"
          value={node.subtitle}
          placeholder="Shot size · camera move"
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => set({ subtitle: e.target.value })}
        />
      </div>

      {/* ── the single primary image slot ── */}
      <div
        className={`frame-slot ${dropping ? 'drop' : ''}`}
        style={{ height: slotH }}
        data-image-slot={node.id}
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={() => setDropping(false)}
      >
        {node.iconOnly ? (
          <div className="slot-icon-mode">{node.icon || '🎬'}</div>
        ) : imgUrl ? (
          <img src={imgUrl} alt={node.title} draggable={false} />
        ) : (
          <div className="slot-empty">
            <span className="ico">⬓</span>
            <span>Drop an image, or drag one from the carousel</span>
          </div>
        )}

        <div className="slot-actions">
          {node.imageAssetId && !node.iconOnly && (
            <button
              className="slot-btn"
              title="Clear image"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => set({ imageAssetId: null })}
            >
              <IconX size={11} />
            </button>
          )}
          <button
            className="slot-btn"
            title={node.iconOnly ? 'Switch to image slot' : 'Switch to icon-only mode'}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => set({ iconOnly: !node.iconOnly })}
          >
            {node.iconOnly ? '▣' : '☺'}
          </button>
        </div>
      </div>

      {/* ── collapsible body ── */}
      <div className="frame-body" onPointerDown={(e) => e.stopPropagation()}>
        <Collapsible
          title="Prompts"
          count={node.prompts.length}
          open={!node.collapsed.prompts}
          onToggle={() => set({ collapsed: { ...node.collapsed, prompts: !node.collapsed.prompts } })}
          right={
            <button
              className="btn btn-ghost btn-sm"
              title="Add prompt block"
              onClick={() => set({ prompts: [...node.prompts, makePrompt()] })}
            >
              <IconPlus size={12} />
            </button>
          }
        >
          {node.prompts.map((p) => (
            <div key={p.id} className="prompt-block">
              <div className="prompt-head">
                <select
                  value={p.target}
                  onChange={(e) => updatePrompt(p.id, { target: e.target.value as PromptBlock['target'] })}
                  className={`prompt-target pt-${p.target}`}
                  style={{ width: 'auto', border: 'none', padding: '1px 4px', cursor: 'pointer' }}
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="text">Text</option>
                  <option value="audio">Audio</option>
                </select>
                <input
                  className="ghost-input"
                  value={p.label}
                  placeholder="Label"
                  onChange={(e) => updatePrompt(p.id, { label: e.target.value })}
                  style={{ fontSize: 10.5, flex: 1, color: 'var(--tx-3)' }}
                />
                <button
                  className="btn btn-ghost btn-sm"
                  title="Enhance with AI"
                  onClick={() => onEnhance(node.id, p.id)}
                  style={{ padding: 3 }}
                >
                  <IconSparkle size={12} />
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  title="Remove prompt"
                  onClick={() => set({ prompts: node.prompts.filter((x) => x.id !== p.id) })}
                  style={{ padding: 3 }}
                >
                  <IconTrash size={11} />
                </button>
              </div>
              <AutoTextarea
                value={p.text}
                onChange={(v) => updatePrompt(p.id, { text: v })}
                placeholder="Write the prompt… use @Name to pull in a character or location"
              />
            </div>
          ))}
          {!node.prompts.length && (
            <div className="dim" style={{ fontSize: 11, padding: '2px 0' }}>
              No prompt blocks yet.
            </div>
          )}
        </Collapsible>

        <Collapsible
          title="Notes"
          open={!node.collapsed.notes}
          onToggle={() => set({ collapsed: { ...node.collapsed, notes: !node.collapsed.notes } })}
        >
          <AutoTextarea
            value={node.notes}
            onChange={(v) => set({ notes: v })}
            placeholder="Direction, continuity, reminders…"
          />
        </Collapsible>

        <Collapsible
          title="Shot detail"
          open={!node.collapsed.meta}
          onToggle={() => set({ collapsed: { ...node.collapsed, meta: !node.collapsed.meta } })}
        >
          <div>
            <div className="label" style={{ marginBottom: 3 }}>
              Description
            </div>
            <AutoTextarea
              value={node.description}
              onChange={(v) => set({ description: v })}
              placeholder="What the audience sees."
            />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 3 }}>
              Audio
            </div>
            <AutoTextarea value={node.audio} onChange={(v) => set({ audio: v })} placeholder="Diegetic sound." minRows={1} />
          </div>
          <div>
            <div className="label" style={{ marginBottom: 3 }}>
              Video / motion
            </div>
            <AutoTextarea value={node.video} onChange={(v) => set({ video: v })} placeholder="Camera move, duration." minRows={1} />
          </div>
          {linkedChars.length > 0 && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
              {linkedChars.map((c) => (
                <span key={c.id} className="tag magenta">
                  {c.name}
                  <button onClick={() => set({ characterIds: node.characterIds.filter((x) => x !== c.id) })}>
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </Collapsible>
      </div>

      {selected && <div className="node-sel-ring" />}
    </div>
  );
}
