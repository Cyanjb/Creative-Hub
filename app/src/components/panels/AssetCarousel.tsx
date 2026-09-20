import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAssetUrl } from '../../lib/useAssetUrl';
import type { Asset, Character } from '../../store/types';
import { IconX } from '../ui/Icons';

/**
 * Bottom strip of saved character sheets, settings and references so they're
 * one drag away from any frame — the "easily accessible from the whiteboard"
 * requirement. Filters by category so a big library stays usable.
 */
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'character', label: 'Characters' },
  { id: 'setting', label: 'Settings' },
  { id: 'reference', label: 'References' },
  { id: 'generated', label: 'Generated' },
] as const;

export function AssetCarousel({ projectId }: { projectId: string }) {
  const assets = useStore((s) => s.assets.filter((a) => a.projectId === projectId));
  const characters = useStore((s) => s.characters.filter((c) => c.projectId === projectId));
  const setCarouselOpen = useStore((s) => s.setCarouselOpen);
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  const matches = (a: Asset) => {
    if (filter === 'generated' ? a.kind !== 'generated' : filter !== 'all' && a.category !== filter)
      return false;
    if (!q.trim()) return true;
    return [a.name, a.category, ...a.tags].join(' ').toLowerCase().includes(q.toLowerCase());
  };

  const shown = assets.filter(matches);

  return (
    <div className="carousel">
      <div className="car-head">
        <span className="label">Asset carousel</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          style={{ width: 180, fontSize: 11.5, padding: '4px 8px' }}
        />
        <div className="row" style={{ gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`btn btn-sm ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <span className="dim" style={{ fontSize: 11 }}>
          Drag onto the canvas, or straight into a frame's image slot
        </span>
        <button className="btn btn-ghost btn-icon" onClick={() => setCarouselOpen(false)}>
          <IconX size={15} />
        </button>
      </div>

      <div className="car-strip">
        {/* Characters lead — they're what you reach for most. */}
        {(filter === 'all' || filter === 'character') &&
          characters.map((c) => <CharacterChip key={c.id} c={c} />)}

        {shown.map((a) => (
          <AssetChip key={a.id} a={a} />
        ))}

        {!shown.length && !characters.length && (
          <div className="dim" style={{ fontSize: 12, padding: '28px 6px' }}>
            Nothing saved yet. Drop images on the canvas or build a character to fill this.
          </div>
        )}
      </div>
    </div>
  );
}

function AssetChip({ a }: { a: Asset }) {
  const url = useAssetUrl(a.id, a.url);
  return (
    <div
      className="car-item"
      draggable
      title={a.name}
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-hub-asset', a.id);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div className="car-thumb">
        {url ? <img src={url} alt={a.name} /> : <span className="dim" style={{ fontSize: 18 }}>⬓</span>}
      </div>
      <div className="car-name">
        <div className="car-kind">{a.category}</div>
        {a.name}
      </div>
    </div>
  );
}

function CharacterChip({ c }: { c: Character }) {
  const url = useAssetUrl(c.portraitAssetId);
  return (
    <div
      className="car-item"
      style={{ borderColor: 'rgba(232,121,249,0.35)' }}
      title={c.logline || c.name}
      draggable
      onDragStart={(e) => {
        // Dragging a character with a portrait drops the portrait image.
        if (c.portraitAssetId) e.dataTransfer.setData('application/x-hub-asset', c.portraitAssetId);
        e.dataTransfer.setData('text/plain', `@${c.name}`);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div className="car-thumb">
        {url ? (
          <img src={url} alt={c.name} />
        ) : (
          <span style={{ fontSize: 20, color: 'var(--magenta)' }}>{c.name.slice(0, 1).toUpperCase()}</span>
        )}
      </div>
      <div className="car-name">
        <div className="car-kind" style={{ color: 'var(--magenta)' }}>
          character
        </div>
        {c.name}
      </div>
    </div>
  );
}
