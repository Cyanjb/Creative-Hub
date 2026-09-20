import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { searchKeywords } from '../../lib/keywordLibrary';
import { toast } from '../ui/Bits';

interface Hit {
  kind: string;
  title: string;
  sub: string;
  go: () => void;
}

/**
 * Global search across the whole project — frames, characters, world, scripts,
 * assets, notes, boards and the cinematography glossary. Cmd/Ctrl-K.
 */
export function SearchPalette({ onClose }: { onClose: () => void }) {
  const state = useStore();
  const [q, setQ] = useState('');
  const [cur, setCur] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const hits = useMemo<Hit[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const pid = state.activeProjectId;
    const inProject = <T extends { projectId: string }>(xs: T[]) =>
      pid ? xs.filter((x) => x.projectId === pid) : xs;
    const has = (...parts: Array<string | undefined>) =>
      parts.filter(Boolean).join(' ').toLowerCase().includes(t);

    const out: Hit[] = [];

    for (const b of inProject(state.boards)) {
      if (has(b.name, b.kind)) {
        out.push({
          kind: 'Board',
          title: b.name,
          sub: `${b.kind} · ${b.nodes.length} items`,
          go: () => {
            state.openProject(b.projectId);
            state.openBoard(b.id);
          },
        });
      }
      for (const n of b.nodes) {
        if (n.kind !== 'frame') continue;
        if (
          has(n.title, n.subtitle, n.scene, n.description, n.notes, n.audio, n.video, ...n.tags, ...n.prompts.map((p) => p.text))
        ) {
          out.push({
            kind: 'Frame',
            title: n.title || 'Untitled shot',
            sub: `${b.name} · ${n.scene}`,
            go: () => {
              state.openProject(b.projectId);
              state.openBoard(b.id);
              state.setSelection([n.id]);
            },
          });
        }
      }
    }

    for (const c of inProject(state.characters)) {
      if (has(c.name, c.role, c.logline, c.appearance, c.wardrobe, c.signature, c.backstory, ...c.tags)) {
        out.push({
          kind: 'Character',
          title: c.name,
          sub: c.role || c.logline || 'Character bible',
          go: () => {
            state.openProject(c.projectId);
            state.setOverlay('bible');
          },
        });
      }
    }

    for (const w of inProject(state.worlds)) {
      if (has(w.name, w.category, w.summary, w.description, w.visualKeys, w.rules, ...w.tags)) {
        out.push({
          kind: 'World',
          title: w.name,
          sub: `${w.category} · ${w.summary || ''}`,
          go: () => {
            state.openProject(w.projectId);
            state.setOverlay('world');
          },
        });
      }
    }

    for (const s of inProject(state.scripts)) {
      if (has(s.title, s.logline, s.treatment, s.genre, ...s.tags, ...s.scenes.map((x) => `${x.heading} ${x.action}`))) {
        out.push({
          kind: 'Script',
          title: s.title,
          sub: s.logline || `${s.scenes.length} scenes`,
          go: () => {
            state.openProject(s.projectId);
            state.setOverlay('script');
          },
        });
      }
    }

    for (const a of inProject(state.assets)) {
      if (has(a.name, a.category, ...a.tags)) {
        out.push({
          kind: 'Asset',
          title: a.name,
          sub: `${a.category} · ${a.kind}`,
          go: () => {
            state.openProject(a.projectId);
            state.setCarouselOpen(true);
          },
        });
      }
    }

    for (const n of inProject(state.notes)) {
      if (has(n.title, n.body, ...n.tags)) {
        out.push({ kind: 'Note', title: n.title, sub: n.body.slice(0, 70), go: () => state.setSidebarOpen(true) });
      }
    }
    for (const r of inProject(state.resources)) {
      if (has(r.title, r.body, ...r.tags)) {
        out.push({ kind: 'Resource', title: r.title, sub: r.body.slice(0, 70), go: () => state.setSidebarOpen(true) });
      }
    }
    for (const l of inProject(state.links)) {
      if (has(l.title, l.url, ...l.tags)) {
        out.push({ kind: 'Link', title: l.title, sub: l.url, go: () => window.open(l.url, '_blank', 'noopener') });
      }
    }

    // Glossary last — useful, but shouldn't bury project content.
    for (const k of searchKeywords(t).slice(0, 8)) {
      out.push({
        kind: 'Keyword',
        title: k.term,
        sub: k.meaning,
        go: () => {
          navigator.clipboard.writeText(k.example);
          toast(`Copied: ${k.example}`, 'ok');
        },
      });
    }

    return out.slice(0, 40);
  }, [q, state]);

  useEffect(() => setCur(0), [q]);

  const run = (h: Hit | undefined) => {
    if (!h) return;
    h.go();
    onClose();
  };

  return (
    <div className="modal-backdrop" style={{ alignItems: 'flex-start' }} onMouseDown={onClose}>
      <div className="modal palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="pal-input"
          value={q}
          placeholder="Search frames, characters, world, scripts, assets, cinematography terms…"
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCur((c) => Math.min(c + 1, hits.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCur((c) => Math.max(c - 1, 0));
            } else if (e.key === 'Enter') {
              e.preventDefault();
              run(hits[cur]);
            } else if (e.key === 'Escape') {
              onClose();
            }
          }}
        />
        {q.trim() !== '' && (
          <div className="pal-results">
            {hits.map((h, i) => (
              <button
                key={`${h.kind}-${h.title}-${i}`}
                className={`pal-row ${i === cur ? 'cur' : ''}`}
                onMouseEnter={() => setCur(i)}
                onClick={() => run(h)}
              >
                <span className="pal-kind">{h.kind}</span>
                <span className="pal-main">
                  <b>{h.title}</b>
                  <span>{h.sub}</span>
                </span>
              </button>
            ))}
            {!hits.length && (
              <div className="empty" style={{ padding: 28 }}>
                <p>No matches for "{q}".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
