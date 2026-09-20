import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Script, ScriptScene } from '../../store/types';
import { AutoTextarea, ConfirmModal, Field, Modal, TagEditor, toast } from '../ui/Bits';
import { IconPlus, IconSparkle, IconTrash, IconX, IconFrame } from '../ui/Icons';
import { generateJson, AiError } from '../../lib/ai';
import { GENERATORS, STORY_BEATS } from '../../lib/promptTemplates';
import { makeScene, makeFrame, FRAME_W, FRAME_H, makePrompt } from '../../lib/factories';

export function ScriptWriter({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const scripts = useStore((s) => s.scripts.filter((x) => x.projectId === projectId));
  const addScript = useStore((s) => s.addScript);
  const [sel, setSel] = useState<string | null>(scripts[0]?.id ?? null);
  const [brief, setBrief] = useState(false);

  const current = scripts.find((s) => s.id === sel) ?? null;

  return (
    <div className="overlay">
      <div className="ov-head">
        <h2>Script Room</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          Structure on the intensity curve — every scene caused by the one before it
        </span>
        <div className="spacer" />
        <button className="btn" onClick={() => setBrief(true)}>
          <IconSparkle size={14} /> Generate treatment
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const s = addScript(projectId);
            setSel(s.id);
          }}
        >
          <IconPlus size={14} /> New
        </button>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <IconX size={16} />
        </button>
      </div>

      <div className="ov-body">
        <div className="ov-list">
          {scripts.map((s) => (
            <button key={s.id} className={`ent-item ${s.id === sel ? 'on' : ''}`} onClick={() => setSel(s.id)}>
              <span className="ent-avatar">✎</span>
              <span className="ent-meta">
                <b>{s.title}</b>
                <span>
                  {s.scenes.length} scene{s.scenes.length === 1 ? '' : 's'}
                </span>
              </span>
            </button>
          ))}
          {!scripts.length && (
            <div className="dim" style={{ fontSize: 12, padding: 10, textAlign: 'center' }}>
              No scripts yet.
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <div className="label" style={{ marginBottom: 7 }}>
              The curve
            </div>
            {STORY_BEATS.map((b) => (
              <div
                key={b.beat}
                style={{
                  fontSize: 10.5,
                  padding: '5px 7px',
                  borderLeft: '2px solid var(--line-2)',
                  marginBottom: 3,
                  color: 'var(--tx-3)',
                }}
              >
                <b style={{ color: 'var(--cyan)' }}>{b.beat}</b> · {b.pct} · {b.intensity}
                <div style={{ color: 'var(--tx-4)', lineHeight: 1.35, marginTop: 1 }}>{b.direction}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ov-editor">
          {current ? (
            <ScriptEditor key={current.id} s={current} onDeleted={() => setSel(null)} />
          ) : (
            <div className="empty">
              <span className="big">✎</span>
              <p>
                Write a treatment and scene list, then push any scene straight onto the board as
                storyboard frames.
              </p>
            </div>
          )}
        </div>
      </div>

      {brief && (
        <BriefModal
          projectId={projectId}
          onClose={() => setBrief(false)}
          onCreated={(id) => {
            setSel(id);
            setBrief(false);
          }}
        />
      )}
    </div>
  );
}

function ScriptEditor({ s, onDeleted }: { s: Script; onDeleted: () => void }) {
  const update = useStore((s) => s.updateScript);
  const del = useStore((s) => s.deleteScript);
  const [confirm, setConfirm] = useState(false);
  const [pushScene, setPushScene] = useState<ScriptScene | null>(null);
  const set = (patch: Partial<Script>) => update(s.id, patch);

  const setScene = (id: string, patch: Partial<ScriptScene>) =>
    set({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, ...patch } : x)) });

  return (
    <div className="ov-editor-inner">
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            className="ghost-input"
            value={s.title}
            onChange={(e) => set({ title: e.target.value })}
            style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' }}
          />
          <div style={{ marginTop: 6 }}>
            <TagEditor tags={s.tags} onChange={(t) => set({ tags: t })} />
          </div>
        </div>
        <button className="btn btn-danger btn-icon" onClick={() => setConfirm(true)}>
          <IconTrash size={14} />
        </button>
      </div>

      <Field label="Logline" hint="One sentence containing protagonist, want and obstacle.">
        <input value={s.logline} onChange={(e) => set({ logline: e.target.value })} />
      </Field>

      <div className="grid2">
        <Field label="Genre">
          <input value={s.genre} onChange={(e) => set({ genre: e.target.value })} />
        </Field>
        <Field label="Tone">
          <input value={s.tone} onChange={(e) => set({ tone: e.target.value })} />
        </Field>
      </div>

      <Field label="Treatment" hint="The emotional argument of the film, not just the plot.">
        <AutoTextarea value={s.treatment} onChange={(v) => set({ treatment: v })} minRows={6} />
      </Field>

      <div className="row" style={{ margin: '22px 0 12px' }}>
        <h3 className="section-title">Scenes</h3>
        <div className="spacer" />
        <button className="btn btn-sm" onClick={() => set({ scenes: [...s.scenes, makeScene()] })}>
          <IconPlus size={12} /> Add scene
        </button>
      </div>

      {s.scenes.map((sc, i) => (
        <div
          key={sc.id}
          style={{
            border: '1px solid var(--line)',
            borderRadius: 'var(--r)',
            padding: 13,
            marginBottom: 11,
            background: 'var(--panel)',
          }}
        >
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="tag plain">{String(i + 1).padStart(2, '0')}</span>
            <input
              className="ghost-input"
              value={sc.heading}
              onChange={(e) => setScene(sc.id, { heading: e.target.value })}
              style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, flex: 1 }}
            />
            <button
              className="btn btn-ghost btn-sm"
              title="Break this scene into storyboard frames"
              onClick={() => setPushScene(sc)}
            >
              <IconFrame size={12} /> To board
            </button>
            <button
              className="btn btn-ghost btn-sm btn-danger"
              onClick={() => set({ scenes: s.scenes.filter((x) => x.id !== sc.id) })}
            >
              <IconTrash size={11} />
            </button>
          </div>

          <div className="label" style={{ marginBottom: 3 }}>
            Action
          </div>
          <AutoTextarea
            value={sc.action}
            onChange={(v) => setScene(sc.id, { action: v })}
            minRows={2}
            placeholder="Present tense, active verbs, only what is visible."
          />

          <div className="label" style={{ margin: '8px 0 3px' }}>
            Dialogue
          </div>
          <AutoTextarea
            value={sc.dialogue}
            onChange={(v) => setScene(sc.id, { dialogue: v })}
            minRows={1}
          />

          <div className="label" style={{ margin: '8px 0 3px' }}>
            Beat / value charge
          </div>
          <input
            className="ghost-input"
            value={sc.notes}
            onChange={(e) => setScene(sc.id, { notes: e.target.value })}
            placeholder="Turn — hope + to hope −"
            style={{ fontSize: 12 }}
          />
        </div>
      ))}

      {pushScene && <PushToBoard scene={pushScene} projectId={s.projectId} onClose={() => setPushScene(null)} />}
      {confirm && (
        <ConfirmModal
          title="Delete script?"
          message={`"${s.title}" and all its scenes will be removed.`}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            del(s.id);
            setConfirm(false);
            onDeleted();
          }}
        />
      )}
    </div>
  );
}

interface ShotOut {
  title: string;
  subtitle: string;
  description: string;
  imagePrompt: string;
  audio: string;
}

function PushToBoard({
  scene,
  projectId,
  onClose,
}: {
  scene: ScriptScene;
  projectId: string;
  onClose: () => void;
}) {
  const boards = useStore((s) => s.boards.filter((b) => b.projectId === projectId));
  const addNodes = useStore((s) => s.addNodes);
  const openBoard = useStore((s) => s.openBoard);
  const setOverlay = useStore((s) => s.setOverlay);
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!boardId) return;
    setBusy(true);
    try {
      const shots = await generateJson<ShotOut[] | { shots: ShotOut[] }>({
        system: GENERATORS.shotsFromScene,
        prompt: `${scene.heading}\n\n${scene.action}\n\n${scene.dialogue}\n\nBeat: ${scene.notes}`,
        maxTokens: 3000,
      });
      const list = Array.isArray(shots) ? shots : shots.shots;
      if (!Array.isArray(list) || !list.length) throw new AiError('No shots returned', 502);

      const board = boards.find((b) => b.id === boardId)!;
      const base = board.nodes.filter((n) => n.kind === 'frame').length;

      const nodes = list.map((sh, i) => {
        const col = (base + i) % 4;
        const row = Math.floor((base + i) / 4);
        return makeFrame(col * (FRAME_W + 70), row * (FRAME_H + 90), {
          title: sh.title || `Shot ${i + 1}`,
          subtitle: sh.subtitle || '',
          scene: scene.heading,
          shot: String(base + i + 1),
          description: sh.description || '',
          audio: sh.audio || '',
          prompts: [makePrompt({ label: 'Image prompt', target: 'image', text: sh.imagePrompt || '' })],
        });
      });

      addNodes(boardId, nodes);
      toast(`${nodes.length} frames added to "${board.name}"`, 'ok');
      onClose();
      setOverlay(null);
      openBoard(boardId);
    } catch (err) {
      toast(err instanceof AiError ? err.message : 'Could not break down the scene', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Break scene into frames"
      onClose={onClose}
      width={520}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={run} disabled={busy || !boardId}>
            {busy ? <span className="spinner" /> : <IconFrame size={14} />}
            {busy ? 'Breaking down…' : 'Create frames'}
          </button>
        </>
      }
    >
      <p style={{ marginTop: 0, color: 'var(--tx-2)', fontSize: 13, lineHeight: 1.55 }}>
        Shots get mapped across the intensity curve, no two consecutive shots share a size and
        angle, and one moment of stillness is included.
      </p>
      <Field label="Target board">
        {boards.length ? (
          <select value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="dim" style={{ fontSize: 12 }}>
            This project has no boards yet — create one first.
          </div>
        )}
      </Field>
    </Modal>
  );
}

function BriefModal({
  projectId,
  onClose,
  onCreated,
}: {
  projectId: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const addScript = useStore((s) => s.addScript);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!brief.trim()) return;
    setBusy(true);
    try {
      const data = await generateJson<Partial<Script>>({
        system: GENERATORS.scriptFromBrief,
        prompt: brief,
        maxTokens: 3000,
      });
      const scenes = Array.isArray(data.scenes)
        ? data.scenes.map((sc) => makeScene(sc))
        : [makeScene()];
      const s = addScript(projectId, { ...data, scenes, tags: [] });
      toast(`"${s.title}" created`, 'ok');
      onCreated(s.id);
    } catch (err) {
      toast(err instanceof AiError ? err.message : 'Generation failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Generate a treatment"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={run} disabled={busy || !brief.trim()}>
            {busy ? <span className="spinner" /> : <IconSparkle size={14} />}
            {busy ? 'Writing…' : 'Generate'}
          </button>
        </>
      }
    >
      <Field label="Brief" hint="Returns a logline, treatment and six scenes — one per beat of the curve.">
        <textarea
          autoFocus
          rows={5}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="A 90-second piece about a dock mechanic who finds something alive inside a sealed container, and has to decide before the shift ends."
        />
      </Field>
    </Modal>
  );
}
