import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { WorldEntry } from '../../store/types';
import { AutoTextarea, ConfirmModal, Field, Modal, TagEditor, toast } from '../ui/Bits';
import { IconPlus, IconSparkle, IconTrash, IconX } from '../ui/Icons';
import { generateJson, AiError } from '../../lib/ai';
import { GENERATORS } from '../../lib/promptTemplates';

const CATEGORIES = ['location', 'faction', 'technology', 'culture', 'era', 'rule', 'prop'];

const CATEGORY_ICON: Record<string, string> = {
  location: '⛰',
  faction: '⚑',
  technology: '⚙',
  culture: '◈',
  era: '⏳',
  rule: '§',
  prop: '⌾',
};

export function WorldBuilder({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const worlds = useStore((s) => s.worlds.filter((w) => w.projectId === projectId));
  const addWorld = useStore((s) => s.addWorld);
  const [sel, setSel] = useState<string | null>(worlds[0]?.id ?? null);
  const [q, setQ] = useState('');
  const [brief, setBrief] = useState(false);

  const current = worlds.find((w) => w.id === sel) ?? null;
  const filtered = q.trim()
    ? worlds.filter((w) =>
        [w.name, w.category, w.summary, ...w.tags].join(' ').toLowerCase().includes(q.toLowerCase()),
      )
    : worlds;

  return (
    <div className="overlay">
      <div className="ov-head">
        <h2>World Builder</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {worlds.length} entr{worlds.length === 1 ? 'y' : 'ies'} · referenced with{' '}
          <code style={{ color: 'var(--magenta)' }}>@Name</code>
        </span>
        <div className="spacer" />
        <button className="btn" onClick={() => setBrief(true)}>
          <IconSparkle size={14} /> Generate from brief
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const w = addWorld(projectId);
            setSel(w.id);
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
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search the world…"
            style={{ marginBottom: 9, fontSize: 12 }}
          />
          {filtered.map((w) => (
            <button
              key={w.id}
              className={`ent-item ${w.id === sel ? 'on' : ''}`}
              onClick={() => setSel(w.id)}
            >
              <span className="ent-avatar">{CATEGORY_ICON[w.category] ?? '◇'}</span>
              <span className="ent-meta">
                <b>{w.name}</b>
                <span>{w.summary || w.category}</span>
              </span>
            </button>
          ))}
          {!filtered.length && (
            <div className="dim" style={{ fontSize: 12, padding: 10, textAlign: 'center' }}>
              {worlds.length ? 'No matches.' : 'Nothing built yet.'}
            </div>
          )}
        </div>

        <div className="ov-editor">
          {current ? (
            <WorldEditor key={current.id} w={current} onDeleted={() => setSel(null)} />
          ) : (
            <div className="empty">
              <span className="big">⛰</span>
              <p>
                Locations, factions, technology, the rules of the place. Each entry's visual keys get
                injected into prompts that reference it.
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

function WorldEditor({ w, onDeleted }: { w: WorldEntry; onDeleted: () => void }) {
  const update = useStore((s) => s.updateWorld);
  const del = useStore((s) => s.deleteWorld);
  const [confirm, setConfirm] = useState(false);
  const set = (patch: Partial<WorldEntry>) => update(w.id, patch);

  return (
    <div className="ov-editor-inner">
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            className="ghost-input"
            value={w.name}
            onChange={(e) => set({ name: e.target.value })}
            style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' }}
            placeholder="Name"
          />
          <div className="row" style={{ marginTop: 6, gap: 10 }}>
            <select
              value={w.category}
              onChange={(e) => set({ category: e.target.value })}
              style={{ width: 150, fontSize: 12 }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_ICON[c]} {c}
                </option>
              ))}
            </select>
            <TagEditor tags={w.tags} onChange={(t) => set({ tags: t })} />
          </div>
        </div>
        <button className="btn btn-danger btn-icon" onClick={() => setConfirm(true)} title="Delete">
          <IconTrash size={14} />
        </button>
      </div>

      <Field label="Summary" hint="One line.">
        <input value={w.summary} onChange={(e) => set({ summary: e.target.value })} />
      </Field>

      <Field
        label="Visual keys (prompt-ready)"
        hint="Palette, weather, time of day, texture, scale, and one signature detail. Pasted verbatim into prompts that reference this entry."
      >
        <AutoTextarea
          value={w.visualKeys}
          onChange={(v) => set({ visualKeys: v })}
          minRows={3}
          placeholder="Sodium-amber and wet concrete, permanent drizzle, corrugated steel gone orange with rust, container stacks nine high, one green crane light that never goes out"
        />
      </Field>

      <Field label="Description" hint="What it is, who controls it, what happened here.">
        <AutoTextarea value={w.description} onChange={(v) => set({ description: v })} minRows={4} />
      </Field>

      <Field label="Rules" hint="What is true here that is not true elsewhere — and what NEVER appears on screen.">
        <AutoTextarea value={w.rules} onChange={(v) => set({ rules: v })} minRows={3} />
      </Field>

      {confirm && (
        <ConfirmModal
          title="Delete entry?"
          message={`"${w.name}" will be removed and unlinked from every frame that references it.`}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            del(w.id);
            setConfirm(false);
            onDeleted();
          }}
        />
      )}
    </div>
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
  const addWorld = useStore((s) => s.addWorld);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!brief.trim()) return;
    setBusy(true);
    try {
      const data = await generateJson<Partial<WorldEntry>>({
        system: GENERATORS.worldFromBrief,
        prompt: brief,
        maxTokens: 1500,
      });
      const w = addWorld(projectId, {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        assetIds: [],
      });
      toast(`"${w.name}" created`, 'ok');
      onCreated(w.id);
    } catch (err) {
      toast(err instanceof AiError ? err.message : 'Generation failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Generate a world entry"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={run} disabled={busy || !brief.trim()}>
            {busy ? <span className="spinner" /> : <IconSparkle size={14} />}
            {busy ? 'Building…' : 'Generate'}
          </button>
        </>
      }
    >
      <Field label="Brief" hint="A place, a faction, a rule of the world — a sentence is enough.">
        <textarea
          autoFocus
          rows={5}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="The container harbour the whole city pretends not to depend on. Run by the dockers' union, not the council."
        />
      </Field>
    </Modal>
  );
}
