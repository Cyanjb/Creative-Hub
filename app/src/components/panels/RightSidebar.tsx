import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { AutoTextarea, TagEditor, toast } from '../ui/Bits';
import { IconPlus, IconTrash } from '../ui/Icons';
import { useAssetUrl } from '../../lib/useAssetUrl';
import type { Asset } from '../../store/types';
import { KeywordPanel } from './KeywordPanel';

type Tab = 'resources' | 'links' | 'notes' | 'assets' | 'keywords';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'resources', label: 'Resources' },
  { id: 'links', label: 'Links' },
  { id: 'notes', label: 'Notes' },
  { id: 'assets', label: 'Assets' },
  { id: 'keywords', label: 'Keywords' },
];

export function RightSidebar({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>('assets');

  return (
    <div className="sidebar">
      <div className="sb-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`sb-tab ${tab === t.id ? 'on' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="sb-content">
        {tab === 'resources' && <ResourcesTab projectId={projectId} />}
        {tab === 'links' && <LinksTab projectId={projectId} />}
        {tab === 'notes' && <NotesTab projectId={projectId} />}
        {tab === 'assets' && <AssetsTab projectId={projectId} />}
        {tab === 'keywords' && <KeywordPanel />}
      </div>
    </div>
  );
}

function AddBar({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <button className="btn btn-sm" onClick={onAdd} style={{ width: '100%', justifyContent: 'center', marginBottom: 11 }}>
      <IconPlus size={12} /> {label}
    </button>
  );
}

function ResourcesTab({ projectId }: { projectId: string }) {
  const items = useStore((s) => s.resources.filter((r) => r.projectId === projectId));
  const add = useStore((s) => s.addResource);
  const update = useStore((s) => s.updateResource);
  const del = useStore((s) => s.deleteResource);

  return (
    <>
      <AddBar label="Add resource" onAdd={() => add(projectId)} />
      {items.map((r) => (
        <div key={r.id} className="list-item">
          <div className="li-head">
            <input
              className="ghost-input"
              value={r.title}
              onChange={(e) => update(r.id, { title: e.target.value })}
              style={{ fontSize: 13, fontWeight: 550 }}
            />
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => del(r.id)}>
              <IconTrash size={11} />
            </button>
          </div>
          <AutoTextarea
            value={r.body}
            onChange={(v) => update(r.id, { body: v })}
            placeholder="Reference, spec, briefing…"
            minRows={2}
          />
          <div style={{ marginTop: 6 }}>
            <TagEditor tags={r.tags} onChange={(t) => update(r.id, { tags: t })} accent="plain" />
          </div>
        </div>
      ))}
      {!items.length && <Empty text="Briefs, specs, references — anything the project leans on." />}
    </>
  );
}

function LinksTab({ projectId }: { projectId: string }) {
  const items = useStore((s) => s.links.filter((l) => l.projectId === projectId));
  const add = useStore((s) => s.addLink);
  const update = useStore((s) => s.updateLink);
  const del = useStore((s) => s.deleteLink);

  return (
    <>
      <AddBar label="Add link" onAdd={() => add(projectId)} />
      {items.map((l) => (
        <div key={l.id} className="list-item">
          <div className="li-head">
            <input
              className="ghost-input"
              value={l.title}
              onChange={(e) => update(l.id, { title: e.target.value })}
              style={{ fontSize: 13, fontWeight: 550 }}
            />
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => del(l.id)}>
              <IconTrash size={11} />
            </button>
          </div>
          <input
            className="ghost-input"
            value={l.url}
            onChange={(e) => update(l.id, { url: e.target.value })}
            placeholder="https://…"
            style={{ fontSize: 11.5, color: 'var(--cyan)' }}
          />
          {l.url && (
            <a
              href={l.url}
              target="_blank"
              rel="noreferrer noopener"
              style={{ fontSize: 11, color: 'var(--tx-4)' }}
            >
              Open ↗
            </a>
          )}
          <div style={{ marginTop: 6 }}>
            <TagEditor tags={l.tags} onChange={(t) => update(l.id, { tags: t })} accent="plain" />
          </div>
        </div>
      ))}
      {!items.length && <Empty text="Reference boards, docs, tool pages." />}
    </>
  );
}

function NotesTab({ projectId }: { projectId: string }) {
  const items = useStore((s) => s.notes.filter((n) => n.projectId === projectId));
  const add = useStore((s) => s.addNote);
  const update = useStore((s) => s.updateNote);
  const del = useStore((s) => s.deleteNote);

  return (
    <>
      <AddBar label="Add note" onAdd={() => add(projectId)} />
      {items.map((n) => (
        <div key={n.id} className="list-item">
          <div className="li-head">
            <input
              className="ghost-input"
              value={n.title}
              onChange={(e) => update(n.id, { title: e.target.value })}
              style={{ fontSize: 13, fontWeight: 550 }}
            />
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => del(n.id)}>
              <IconTrash size={11} />
            </button>
          </div>
          <AutoTextarea value={n.body} onChange={(v) => update(n.id, { body: v })} minRows={3} />
          <div style={{ marginTop: 6 }}>
            <TagEditor tags={n.tags} onChange={(t) => update(n.id, { tags: t })} accent="plain" />
          </div>
        </div>
      ))}
      {!items.length && <Empty text="Loose thinking that doesn't belong on a board yet." />}
    </>
  );
}

function AssetsTab({ projectId }: { projectId: string }) {
  const assets = useStore((s) => s.assets.filter((a) => a.projectId === projectId));
  const del = useStore((s) => s.deleteAsset);
  const [q, setQ] = useState('');

  const filtered = q.trim()
    ? assets.filter((a) => [a.name, a.category, ...a.tags].join(' ').toLowerCase().includes(q.toLowerCase()))
    : assets;

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search assets…"
        style={{ marginBottom: 11, fontSize: 12 }}
      />
      <div className="muted" style={{ fontSize: 11, marginBottom: 9 }}>
        {assets.length} logged automatically. Drag any tile onto the canvas or into a frame slot.
      </div>
      <div className="asset-grid">
        {filtered.map((a) => (
          <AssetTile key={a.id} asset={a} onDelete={() => del(a.id)} />
        ))}
      </div>
      {!filtered.length && <Empty text={assets.length ? 'No matches.' : 'Drop images on the canvas — they log here automatically.'} />}
    </>
  );
}

export function AssetTile({ asset, onDelete }: { asset: Asset; onDelete: () => void }) {
  const url = useAssetUrl(asset.id, asset.url);
  return (
    <div
      className="asset-tile"
      title={`${asset.name} · ${asset.category}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-hub-asset', asset.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      {url ? <img src={url} alt={asset.name} /> : <div className="dim" style={{ fontSize: 9, padding: 6 }}>{asset.name}</div>}
      <button
        className="x"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          toast('Asset deleted');
        }}
        title="Delete asset"
      >
        ×
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="empty" style={{ padding: '26px 12px' }}>
      <p style={{ fontSize: 12 }}>{text}</p>
    </div>
  );
}
