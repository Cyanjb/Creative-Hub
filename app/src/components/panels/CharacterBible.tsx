import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Character } from '../../store/types';
import { Field, Modal, TagEditor, toast, AutoTextarea, ConfirmModal } from '../ui/Bits';
import { IconPlus, IconSparkle, IconTrash, IconX, IconCopy } from '../ui/Icons';
import { useAssetUrl } from '../../lib/useAssetUrl';
import { generateJson, AiError } from '../../lib/ai';
import { GENERATORS, SHEET_PRESETS, RENDER_STACK, CEL_REGISTERS, type RenderStyle } from '../../lib/promptTemplates';
import { importImageFile } from '../../lib/importImage';

export function CharacterBible({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const characters = useStore((s) => s.characters.filter((c) => c.projectId === projectId));
  const addCharacter = useStore((s) => s.addCharacter);
  const [sel, setSel] = useState<string | null>(characters[0]?.id ?? null);
  const [q, setQ] = useState('');
  const [brief, setBrief] = useState(false);

  const current = characters.find((c) => c.id === sel) ?? null;
  const filtered = q.trim()
    ? characters.filter((c) =>
        [c.name, c.role, c.logline, ...c.tags].join(' ').toLowerCase().includes(q.toLowerCase()),
      )
    : characters;

  return (
    <div className="overlay">
      <div className="ov-head">
        <h2>Character Bible</h2>
        <span className="muted" style={{ fontSize: 12 }}>
          {characters.length} character{characters.length === 1 ? '' : 's'} · referenced anywhere with{' '}
          <code style={{ color: 'var(--magenta)' }}>@Name</code>
        </span>
        <div className="spacer" />
        <button className="btn" onClick={() => setBrief(true)}>
          <IconSparkle size={14} /> Generate from brief
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            const c = addCharacter(projectId);
            setSel(c.id);
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
            placeholder="Search characters…"
            style={{ marginBottom: 9, fontSize: 12 }}
          />
          {filtered.map((c) => (
            <CharacterRow key={c.id} c={c} on={c.id === sel} onClick={() => setSel(c.id)} />
          ))}
          {!filtered.length && (
            <div className="dim" style={{ fontSize: 12, padding: 10, textAlign: 'center' }}>
              {characters.length ? 'No matches.' : 'No characters yet.'}
            </div>
          )}
        </div>

        <div className="ov-editor">
          {current ? (
            <CharacterEditor key={current.id} c={current} onDeleted={() => setSel(null)} />
          ) : (
            <div className="empty">
              <span className="big">◑</span>
              <p>
                Select a character, or create one. Everything you write here follows through into
                prompts across every board in the project.
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

function CharacterRow({ c, on, onClick }: { c: Character; on: boolean; onClick: () => void }) {
  const url = useAssetUrl(c.portraitAssetId);
  return (
    <button className={`ent-item ${on ? 'on' : ''}`} onClick={onClick}>
      <span className="ent-avatar">
        {url ? <img src={url} alt="" /> : c.name.slice(0, 1).toUpperCase()}
      </span>
      <span className="ent-meta">
        <b>{c.name}</b>
        <span>{c.role || c.logline || '—'}</span>
      </span>
    </button>
  );
}

function CharacterEditor({ c, onDeleted }: { c: Character; onDeleted: () => void }) {
  const update = useStore((s) => s.updateCharacter);
  const del = useStore((s) => s.deleteCharacter);
  const addAsset = useStore((s) => s.addAsset);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const portrait = useAssetUrl(c.portraitAssetId);

  const set = (patch: Partial<Character>) => update(c.id, patch);

  const uploadPortrait = async (file: File) => {
    try {
      const a = await importImageFile(file, c.projectId, 'character');
      addAsset(a);
      set({ portraitAssetId: a.id });
    } catch {
      toast('Could not read that image', 'err');
    }
  };

  return (
    <div className="ov-editor-inner">
      <div className="row" style={{ alignItems: 'flex-start', marginBottom: 18, gap: 16 }}>
        <label
          style={{
            width: 84,
            height: 84,
            borderRadius: 12,
            border: '1px solid var(--line)',
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'pointer',
            flex: '0 0 auto',
          }}
          title="Upload a portrait"
        >
          {portrait ? (
            <img src={portrait} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span className="dim" style={{ fontSize: 11, textAlign: 'center', padding: 6 }}>
              Add portrait
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && uploadPortrait(e.target.files[0])}
          />
        </label>

        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            className="ghost-input"
            value={c.name}
            onChange={(e) => set({ name: e.target.value })}
            style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' }}
            placeholder="Character name"
          />
          <input
            className="ghost-input"
            value={c.role}
            onChange={(e) => set({ role: e.target.value })}
            placeholder="Role — protagonist, opposition, support…"
            style={{ color: 'var(--tx-3)', fontSize: 13 }}
          />
          <div style={{ marginTop: 8 }}>
            <TagEditor tags={c.tags} onChange={(t) => set({ tags: t })} accent="magenta" />
          </div>
        </div>

        <div className="row" style={{ flex: '0 0 auto' }}>
          <button className="btn" onClick={() => setSheet(true)}>
            <IconSparkle size={14} /> Character sheet
          </button>
          <button className="btn btn-danger btn-icon" onClick={() => setConfirm(true)} title="Delete">
            <IconTrash size={14} />
          </button>
        </div>
      </div>

      <Field label="Logline" hint="One line — who they are and what it costs them.">
        <input value={c.logline} onChange={(e) => set({ logline: e.target.value })} />
      </Field>

      <Field
        label="Signature (canonical prompt lock)"
        hint="The paragraph pasted verbatim into every image and video prompt. If this is filled in it wins over the fields below."
      >
        <AutoTextarea
          value={c.signature}
          onChange={(v) => set({ signature: v })}
          minRows={3}
          placeholder="Late 20s, sharp jaw, dark undercut with a silver hoop in the left ear only, brown leather jacket with a scratch on the left forearm…"
        />
      </Field>

      <div className="grid2">
        <Field label="Age">
          <input value={c.age} onChange={(e) => set({ age: e.target.value })} />
        </Field>
        <Field label="Voice" hint="Rhythm, vocabulary, what they never say.">
          <input value={c.voice} onChange={(e) => set({ voice: e.target.value })} />
        </Field>
      </div>

      <Field label="Appearance" hint="Include at least two distinctive asymmetries — they act as identity anchors.">
        <AutoTextarea value={c.appearance} onChange={(v) => set({ appearance: v })} minRows={3} />
      </Field>

      <Field label="Wardrobe" hint="The silhouette the audience learns to recognise. Name fabrics and footwear.">
        <AutoTextarea value={c.wardrobe} onChange={(v) => set({ wardrobe: v })} minRows={2} />
      </Field>

      <Field label="Personality">
        <AutoTextarea value={c.personality} onChange={(v) => set({ personality: v })} minRows={2} />
      </Field>

      <Field label="Backstory">
        <AutoTextarea value={c.backstory} onChange={(v) => set({ backstory: v })} minRows={3} />
      </Field>

      <Field label="Arc" hint='The value that changes in them — "from X to Y".'>
        <AutoTextarea value={c.arc} onChange={(v) => set({ arc: v })} minRows={2} />
      </Field>

      {sheet && <SheetBuilder character={c} onClose={() => setSheet(false)} />}
      {confirm && (
        <ConfirmModal
          title="Delete character?"
          message={`"${c.name}" will be removed and unlinked from every frame that references them.`}
          onCancel={() => setConfirm(false)}
          onConfirm={() => {
            del(c.id);
            setConfirm(false);
            onDeleted();
          }}
        />
      )}
    </div>
  );
}

/**
 * Character-sheet prompt builder.
 *
 * Presets come from promptTemplates.ts — Cyan's 7-panel contact sheet and the
 * 3-panel identity anchor, either of which can render photoreal or animated.
 * The style fork swaps the whole render stack including the negation battery,
 * because appending "anime" to a photoreal prompt does not work.
 */
function SheetBuilder({ character, onClose }: { character: Character; onClose: () => void }) {
  const [presetId, setPresetId] = useState(SHEET_PRESETS[0].id);
  const [style, setStyle] = useState<RenderStyle>('photoreal');
  const [reg, setReg] = useState<string>(CEL_REGISTERS[0].id);
  const [fromRef, setFromRef] = useState(Boolean(character.portraitAssetId));

  const preset = SHEET_PRESETS.find((p) => p.id === presetId)!;
  const subject =
    character.signature.trim() ||
    [character.name, character.appearance, character.wardrobe].filter(Boolean).join(', ') ||
    character.name;

  const prompt = preset.build({
    subject,
    style,
    celRegister: reg,
    fromReference: fromRef,
    wardrobe: character.wardrobe || undefined,
  });

  return (
    <Modal
      title={`Character sheet — ${character.name}`}
      onClose={onClose}
      width={780}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(prompt);
              toast('Prompt copied', 'ok');
            }}
          >
            <IconCopy size={14} /> Copy prompt
          </button>
        </>
      }
    >
      <div className="label" style={{ marginBottom: 8 }}>
        Layout
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {SHEET_PRESETS.map((p) => (
          <button
            key={p.id}
            className="tpl-card"
            style={{
              padding: 12,
              borderColor: presetId === p.id ? 'var(--cyan)' : undefined,
              background: presetId === p.id ? 'rgba(34,211,238,0.07)' : undefined,
            }}
            onClick={() => setPresetId(p.id)}
          >
            <b style={{ fontSize: 12.5 }}>{p.name}</b>
            <p style={{ fontSize: 10.5 }}>{p.bestFor}</p>
          </button>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 14, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Render style
          </div>
          <div className="seg">
            {(Object.keys(RENDER_STACK) as RenderStyle[]).map((s) => (
              <button key={s} className={style === s ? 'on' : ''} onClick={() => setStyle(s)}>
                {RENDER_STACK[s].label}
              </button>
            ))}
          </div>
        </div>

        {style === 'animated' && (
          <div>
            <div className="label" style={{ marginBottom: 6 }}>
              Cel register
            </div>
            <select value={reg} onChange={(e) => setReg(e.target.value)} style={{ width: 190 }}>
              {CEL_REGISTERS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div className="label" style={{ marginBottom: 6 }}>
            Source
          </div>
          <label className="row" style={{ fontSize: 12.5, cursor: 'pointer', gap: 6 }}>
            <input
              type="checkbox"
              checked={fromRef}
              onChange={(e) => setFromRef(e.target.checked)}
              style={{ width: 'auto' }}
            />
            Working from a reference image
          </label>
        </div>
      </div>

      <div className="hint" style={{ marginBottom: 8 }}>
        {preset.panels}
      </div>

      <textarea
        value={prompt}
        readOnly
        rows={16}
        style={{ fontFamily: 'var(--mono)', fontSize: 11.5, lineHeight: 1.6 }}
      />
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
  const addCharacter = useStore((s) => s.addCharacter);
  const [brief, setBrief] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!brief.trim()) return;
    setBusy(true);
    try {
      const data = await generateJson<Partial<Character>>({
        system: GENERATORS.characterFromBrief,
        prompt: brief,
        maxTokens: 1800,
      });
      const c = addCharacter(projectId, {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
        sheetAssetIds: [],
        portraitAssetId: null,
      });
      toast(`"${c.name}" created`, 'ok');
      onCreated(c.id);
    } catch (err) {
      toast(err instanceof AiError ? err.message : 'Generation failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Generate a character"
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
      <Field
        label="Brief"
        hint="A sentence is enough. The generator fills in appearance, wardrobe, voice, arc and a canonical prompt lock."
      >
        <textarea
          autoFocus
          rows={5}
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="A dock-worker in her thirties who fixes the machines nobody else will touch, and is quietly the most dangerous person in the harbour."
        />
      </Field>
    </Modal>
  );
}
