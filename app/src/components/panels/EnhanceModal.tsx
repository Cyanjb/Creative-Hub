import {frameView} from '../../../shared/v2Domain';
import { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import type { FrameNode } from '../../store/types';
import { Modal, toast } from '../ui/Bits';
import { IconSparkle, IconCopy } from '../ui/Icons';
import { ENHANCERS } from '../../lib/promptTemplates';
import { buildContext } from '../../lib/contextResolver';
import { generateText, AiError, type TextProvider } from '../../lib/ai';

/**
 * Prompt enhancer.
 *
 * The important part is the context block: characters and locations referenced
 * by @mention or by explicit link are resolved to their canonical descriptions
 * and sent with the prompt, so the ecosystem actually follows through instead
 * of the model inventing a new version of the character each time.
 */
export function EnhanceModal({
  boardId,
  frameId,
  promptId,
  onClose,
}: {
  boardId: string;
  frameId: string;
  promptId: string;
  onClose: () => void;
}) {
  const state = useStore();
  const rawBoard=state.boards.find((b)=>b.id===boardId);
  const board=rawBoard?frameView(state,rawBoard):undefined;
  const frame = board?.nodes.find((n) => n.id === frameId) as FrameNode | undefined;
  const prompt = frame?.prompts.find((p) => p.id === promptId);

  const [enhancerId, setEnhancerId] = useState(() => {
    const t = prompt?.target ?? 'image';
    return ENHANCERS.find((e) => e.target === t)?.id ?? ENHANCERS[0].id;
  });
  const [provider, setProvider] = useState<TextProvider>('anthropic');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const ctx = useMemo(() => {
    if (!frame || !state.activeProjectId) return null;
    return buildContext(state, state.activeProjectId, {
      text: `${prompt?.text ?? ''} ${frame.description} ${frame.notes}`,
      characterIds: frame.characterIds,
      worldIds: frame.worldIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, prompt?.text, state.characters, state.worlds, state.activeProjectId]);

  if (!frame || !prompt) return null;

  const enhancer = ENHANCERS.find((e) => e.id === enhancerId)!;

  const run = async () => {
    setBusy(true);
    setResult('');
    try {
      const shotContext = [
        frame.title && `Shot: ${frame.title}`,
        frame.subtitle && `Framing: ${frame.subtitle}`,
        frame.scene && `Scene: ${frame.scene}`,
        frame.description && `Description: ${frame.description}`,
        frame.notes && `Notes: ${frame.notes}`,
      ]
        .filter(Boolean)
        .join('\n');

      const body = [
        ctx?.block,
        shotContext && `SHOT CONTEXT\n${shotContext}`,
        `DRAFT PROMPT\n${prompt.text || '(empty — write one from the shot context above)'}`,
      ]
        .filter(Boolean)
        .join('\n\n');

      const text = await generateText({
        provider,
        system: enhancer.instruction,
        prompt: body,
        maxTokens: 1600,
      });
      setResult(text);
    } catch (err) {
      toast(err instanceof AiError ? err.message : 'Enhancement failed', 'err');
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    state.updateFrame(boardId, frameId, {
      prompts: frame.prompts.map((p) => (p.id === promptId ? { ...p, text: result } : p)),
    });
    toast('Prompt updated', 'ok');
    onClose();
  };

  return (
    <Modal
      title="Enhance prompt"
      onClose={onClose}
      width={760}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          {result && (
            <button
              className="btn"
              onClick={() => {
                navigator.clipboard.writeText(result);
                toast('Copied', 'ok');
              }}
            >
              <IconCopy size={14} /> Copy
            </button>
          )}
          <button className="btn btn-primary" onClick={result ? apply : run} disabled={busy}>
            {busy ? <span className="spinner" /> : <IconSparkle size={14} />}
            {busy ? 'Writing…' : result ? 'Apply to frame' : 'Enhance'}
          </button>
        </>
      }
    >
      <div className="row" style={{ gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="label" style={{ marginBottom: 5 }}>
            Enhancer
          </div>
          <select value={enhancerId} onChange={(e) => setEnhancerId(e.target.value)}>
            {ENHANCERS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} — {e.target}
              </option>
            ))}
          </select>
          <div className="hint" style={{ marginTop: 4 }}>
            {enhancer.blurb}
          </div>
        </div>
        <div style={{ width: 150 }}>
          <div className="label" style={{ marginBottom: 5 }}>
            Engine
          </div>
          <select value={provider} onChange={(e) => setProvider(e.target.value as TextProvider)}>
            <option value="anthropic">Claude</option>
            <option value="openai">ChatGPT</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
      </div>

      {ctx && (ctx.characters.length > 0 || ctx.worlds.length > 0) && (
        <div
          style={{
            border: '1px solid rgba(232,121,249,0.3)',
            background: 'rgba(232,121,249,0.06)',
            borderRadius: 'var(--r)',
            padding: '9px 11px',
            marginBottom: 14,
          }}
        >
          <div className="label" style={{ color: 'var(--magenta)', marginBottom: 6 }}>
            Canon being sent with this prompt
          </div>
          <div className="row" style={{ flexWrap: 'wrap', gap: 5 }}>
            {ctx.characters.map((c) => (
              <span key={c.id} className="tag magenta">
                {c.name}
              </span>
            ))}
            {ctx.worlds.map((w) => (
              <span key={w.id} className="tag">
                {w.name}
              </span>
            ))}
          </div>
          {ctx.unresolved.length > 0 && (
            <div className="hint" style={{ marginTop: 6 }}>
              Not in the bible yet: {ctx.unresolved.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="label" style={{ marginBottom: 5 }}>
        Draft
      </div>
      <textarea
        readOnly
        value={prompt.text || '(empty)'}
        rows={4}
        style={{ fontFamily: 'var(--mono)', fontSize: 11.5, marginBottom: 14, color: 'var(--tx-3)' }}
      />

      {result && (
        <>
          <div className="label" style={{ marginBottom: 5, color: 'var(--cyan)' }}>
            Enhanced
          </div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={12}
            style={{ fontFamily: 'var(--mono)', fontSize: 11.5, borderColor: 'var(--cyan-dim)' }}
          />
        </>
      )}
    </Modal>
  );
}
