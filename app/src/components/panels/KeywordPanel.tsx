import { useState } from 'react';
import { KEYWORD_LIBRARY, searchKeywords, type Keyword } from '../../lib/keywordLibrary';
import { toast } from '../ui/Bits';
import { IconCopy } from '../ui/Icons';

/**
 * The cinematography glossary, searchable and one-click copyable.
 * Ported from Cyan's Craft "Cinematography Keyword Library".
 */
export function KeywordPanel() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(KEYWORD_LIBRARY[0].id);

  const results = q.trim() ? searchKeywords(q) : null;

  return (
    <>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search 90+ terms…"
        style={{ marginBottom: 12, fontSize: 12 }}
      />

      {results ? (
        <>
          <div className="muted" style={{ fontSize: 11, marginBottom: 9 }}>
            {results.length} match{results.length === 1 ? '' : 'es'}
          </div>
          {results.map((k) => (
            <KeywordItem key={`${k.category}-${k.term}`} k={k} showCat />
          ))}
          {!results.length && (
            <div className="empty" style={{ padding: '22px 10px' }}>
              <p style={{ fontSize: 12 }}>Nothing matches "{q}".</p>
            </div>
          )}
        </>
      ) : (
        KEYWORD_LIBRARY.map((cat) => (
          <div className="kw-cat" key={cat.id}>
            <h4
              style={{ cursor: 'pointer' }}
              onClick={() => setOpen(open === cat.id ? null : cat.id)}
            >
              <span style={{ opacity: 0.7 }}>{cat.icon}</span>
              {cat.name}
              <span style={{ marginLeft: 'auto', color: 'var(--tx-4)', fontWeight: 500 }}>
                {cat.items.length}
              </span>
            </h4>
            {open === cat.id && cat.items.map((k) => <KeywordItem key={k.term} k={k} />)}
          </div>
        ))
      )}
    </>
  );
}

function KeywordItem({ k, showCat }: { k: Keyword & { category?: string }; showCat?: boolean }) {
  return (
    <div className="kw-item">
      <div className="row" style={{ gap: 6 }}>
        <b>{k.term}</b>
        {showCat && k.category && (
          <span className="tag plain" style={{ fontSize: 9 }}>
            {k.category}
          </span>
        )}
      </div>
      <div className="mean">{k.meaning}</div>
      <div className="when">{k.useWhen}</div>
      <div className="kw-ex">
        <span>{k.example}</span>
        <span className="spacer" />
        <button
          className="btn btn-ghost btn-sm"
          title="Copy example phrasing"
          style={{ padding: 2, flex: '0 0 auto' }}
          onClick={() => {
            navigator.clipboard.writeText(k.example);
            toast('Copied', 'ok');
          }}
        >
          <IconCopy size={11} />
        </button>
      </div>
    </div>
  );
}
