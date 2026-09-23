import { useEffect, useState } from 'react';
import { getStatus, type StatusResponse } from '../../lib/ai';
import { IconX } from '../ui/Icons';

const PROVIDERS = [
  { id: 'anthropic', name: 'Claude', logo: '✦', role: 'Prompt enhancement, character & world generation, scene breakdown', env: 'ANTHROPIC_API_KEY', where: 'console.anthropic.com' },
  { id: 'openai', name: 'ChatGPT', logo: '◍', role: 'Alternative text engine', env: 'OPENAI_API_KEY', where: 'platform.openai.com' },
  { id: 'gemini', name: 'Nano Banana / Gemini', logo: '🍌', role: 'Image generation — character sheets, storyboard panels', env: 'GEMINI_API_KEY', where: 'aistudio.google.com' },
  { id: 'runway', name: 'Runway', logo: '▶', role: 'Image → video', env: 'RUNWAY_API_KEY', where: 'dev.runwayml.com' },
  { id: 'higgsfield', name: 'Higgsfield', logo: '◈', role: 'Character plates, Soul Cinema, motion', env: 'HIGGSFIELD_API_KEY', where: 'higgsfield.ai' },
  { id: 'openart', name: 'OpenArt', logo: '◎', role: 'Image generation & style models', env: 'OPENART_API_KEY', where: 'openart.ai' },
];

export function IntegrationsPanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [checked, setChecked] = useState(false);

  const refresh = async () => {
    setChecked(false);
    setStatus(await getStatus());
    setChecked(true);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const serverUp = status !== null;

  return (
    <div className="overlay">
      <div className="ov-head">
        <h2>Integrations</h2>
        <div className="spacer" />
        <button className="btn" onClick={refresh}>
          Re-check
        </button>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <IconX size={16} />
        </button>
      </div>

      <div className="ov-editor" style={{ padding: '24px 28px' }}>
        <div className="ov-editor-inner">
          <div
            className="int-card"
            style={{
              borderColor: serverUp ? 'rgba(52,211,153,0.4)' : 'rgba(251,113,133,0.45)',
              marginBottom: 20,
            }}
          >
            <span className="int-logo">{serverUp ? '✓' : '!'}</span>
            <div className="int-info">
              <b>{serverUp ? 'Local API server connected' : 'Local API server not reachable'}</b>
              <span>
                {serverUp
                  ? 'Keys are read from .env on your machine and never reach the browser.'
                  : 'Start it with `npm run dev`, which runs the web app and the API together.'}
              </span>
            </div>
            <span className={`status-dot ${serverUp ? 'on' : 'off'}`} />
          </div>

          <p style={{ color: 'var(--tx-3)', fontSize: 13, lineHeight: 1.6, marginTop: 0 }}>
            Add a key by putting it in <code style={{ color: 'var(--cyan)' }}>.env</code> at the project
            root, then restarting the server. Copy <code style={{ color: 'var(--cyan)' }}>.env.example</code>{' '}
            to get the full list. Keys are never entered in the browser and never leave your machine
            except to the provider you're calling.
          </p>

          <h3 className="section-title" style={{ margin: '24px 0 12px' }}>
            Providers
          </h3>

          {PROVIDERS.map((p) => {
            const on = status?.providers?.[p.id]?.configured ?? false;
            return (
              <div className="int-card" key={p.id}>
                <span className="int-logo">{p.logo}</span>
                <div className="int-info">
                  <b>{p.name}</b>
                  <span>{p.role}</span>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                  <div className="row" style={{ justifyContent: 'flex-end', gap: 7 }}>
                    <span className={`status-dot ${on ? 'on' : 'off'}`} />
                    <span style={{ fontSize: 11.5, color: on ? 'var(--green)' : 'var(--tx-4)' }}>
                      {!checked ? 'checking…' : on ? 'connected' : 'not configured'}
                    </span>
                  </div>
                  <code style={{ fontSize: 10, color: 'var(--tx-4)' }}>{p.env}</code>
                  <div style={{ fontSize: 10, color: 'var(--tx-4)' }}>{p.where}</div>
                </div>
              </div>
            );
          })}

          {status?.models && (
            <>
              <h3 className="section-title" style={{ margin: '24px 0 10px' }}>
                Models in use
              </h3>
              <div className="list-item">
                {Object.entries(status.models).map(([k, v]) => (
                  <div key={k} className="row" style={{ fontSize: 12, padding: '3px 0' }}>
                    <span style={{ color: 'var(--tx-3)', width: 120 }}>{k}</span>
                    <code style={{ color: 'var(--cyan)' }}>{v}</code>
                  </div>
                ))}
                <div className="hint" style={{ marginTop: 8 }}>
                  Change these in <code>server/index.js</code> → <code>MODELS</code>.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
