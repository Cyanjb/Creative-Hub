import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TEMPLATES } from '../../lib/boardTemplates';
import { Field, Modal, toast, ConfirmModal } from '../ui/Bits';
import { IconX, IconTrash, IconPlus } from '../ui/Icons';
import { relativeTime } from '../../lib/id';

/**
 * Saved workflow templates. Built-in board templates are here for reference;
 * the useful half is capturing a selection off a board and re-dropping it.
 */
export function TemplatesPanel({ boardId, onClose }: { boardId: string | null; onClose: () => void }) {
  const templates = useStore((s) => s.workflowTemplates);
  const selection = useStore((s) => s.selection);
  const board = useStore((s) => s.boards.find((b) => b.id === boardId) ?? null);
  const save = useStore((s) => s.saveWorkflowTemplate);
  const apply = useStore((s) => s.applyWorkflowTemplate);
  const del = useStore((s) => s.deleteWorkflowTemplate);

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [confirm, setConfirm] = useState<string | null>(null);

  const doSave = () => {
    if (!boardId || !name.trim()) return;
    save(name.trim(), desc.trim(), boardId, selection);
    setSaving(false);
    setName('');
    setDesc('');
    toast('Workflow template saved', 'ok');
  };

  const doApply = (id: string) => {
    if (!boardId || !board) return;
    // Drop it into the middle of the current view.
    const cam = board.camera;
    apply(id, boardId, {
      x: Math.round((-cam.x + 380) / cam.zoom),
      y: Math.round((-cam.y + 240) / cam.zoom),
    });
    onClose();
    toast('Template placed on the board', 'ok');
  };

  return (
    <div className="overlay">
      <div className="ov-head">
        <h2>Templates</h2>
        <div className="spacer" />
        <button
          className="btn btn-primary"
          disabled={!boardId || !selection.length}
          onClick={() => setSaving(true)}
          title={selection.length ? undefined : 'Select frames on the board first'}
        >
          <IconPlus size={14} /> Save selection as template
        </button>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <IconX size={16} />
        </button>
      </div>

      <div className="ov-editor" style={{ padding: '24px 28px' }}>
        <div className="ov-editor-inner">
          <h3 className="section-title" style={{ marginBottom: 12 }}>
            Board templates
          </h3>
          <p className="hint" style={{ marginBottom: 14 }}>
            Used when creating a new board, from the project page.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32 }}>
            {TEMPLATES.map((t) => (
              <div className="tpl-card" key={t.id} style={{ ['--accent' as string]: t.accent, cursor: 'default' }}>
                <span className="ico">{t.icon}</span>
                <b>{t.name}</b>
                <p>{t.blurb}</p>
              </div>
            ))}
          </div>

          <h3 className="section-title" style={{ marginBottom: 12 }}>
            Saved workflows
          </h3>
          <p className="hint" style={{ marginBottom: 14 }}>
            Select frames and wires on a board, save them here, and drop the whole pattern onto any
            other board. Wires and prompt blocks come with it.
          </p>

          {!templates.length ? (
            <div className="empty">
              <span className="big">⇉</span>
              <p>
                No saved workflows yet. Select some frames on a board and use "Save selection as
                template" — that's how a repeatable pipeline gets captured.
              </p>
            </div>
          ) : (
            templates.map((t) => (
              <div className="list-item" key={t.id}>
                <div className="li-head">
                  <div style={{ flex: 1 }}>
                    <h5>{t.name}</h5>
                    <p>{t.description || 'No description.'}</p>
                    <div className="row" style={{ gap: 9, marginTop: 6, fontSize: 11, color: 'var(--tx-4)' }}>
                      <span>{t.nodes.length} nodes</span>
                      <span>·</span>
                      <span>{t.wires.length} wires</span>
                      <span>·</span>
                      <span>{relativeTime(t.createdAt)}</span>
                    </div>
                  </div>
                  <div className="row">
                    <button className="btn btn-sm" disabled={!boardId} onClick={() => doApply(t.id)}>
                      Place on board
                    </button>
                    <button className="btn btn-ghost btn-sm btn-danger" onClick={() => setConfirm(t.id)}>
                      <IconTrash size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {saving && (
        <Modal
          title="Save workflow template"
          onClose={() => setSaving(false)}
          footer={
            <>
              <button className="btn" onClick={() => setSaving(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={doSave} disabled={!name.trim()}>
                Save template
              </button>
            </>
          }
        >
          <p style={{ marginTop: 0, fontSize: 13, color: 'var(--tx-2)' }}>
            Capturing <b>{selection.length}</b> selected item{selection.length === 1 ? '' : 's'} and any
            wires between them.
          </p>
          <Field label="Template name">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 16-panel dance loop" />
          </Field>
          <Field label="Description" hint="What this pipeline is for.">
            <textarea rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal
          title="Delete template?"
          message="The saved workflow will be removed. Boards already built from it are unaffected."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            del(confirm);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}
