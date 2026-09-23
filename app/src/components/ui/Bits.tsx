import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IconX } from './Icons';

// ── Modal ────────────────────────────────────────────────────────────────

export function Modal({
  title,
  onClose,
  children,
  footer,
  width = 520,
  className = '',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
  className?: string;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${className}`}
        style={{ width }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <div className="spacer" />
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <IconX size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ── Field ────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

/** Textarea that grows to fit its content — used all over the frame cards. */
export function AutoTextarea({
  value,
  onChange,
  placeholder,
  minRows = 2,
  className = '',
  onFocus,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      value={value}
      rows={minRows}
      placeholder={placeholder}
      onFocus={onFocus}
      onBlur={onBlur}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ── Tag editor ───────────────────────────────────────────────────────────

export function TagEditor({
  tags,
  onChange,
  accent = 'cyan',
  placeholder = 'add tag…',
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  accent?: 'cyan' | 'magenta' | 'plain';
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const cls = accent === 'cyan' ? 'tag' : `tag ${accent}`;

  const commit = () => {
    const v = draft.trim().toLowerCase();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setDraft('');
  };

  return (
    <div className="row" style={{ flexWrap: 'wrap', gap: 5 }}>
      {tags.map((t) => (
        <span key={t} className={cls}>
          {t}
          <button onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove ${t}`}>
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Backspace' && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        style={{ width: 96, padding: '2px 7px', fontSize: 11, background: 'transparent' }}
      />
    </div>
  );
}

// ── Collapsible ──────────────────────────────────────────────────────────

export function Collapsible({
  title,
  open,
  onToggle,
  count,
  children,
  right,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  count?: number;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="fsec">
      <div className="row" style={{ gap: 0 }}>
        <button className="fsec-head" onClick={onToggle}>
          <span className={`fsec-chev ${open ? 'open' : ''}`}>▶</span>
          {title}
          {count !== undefined && count > 0 && <span className="fsec-count">{count}</span>}
        </button>
        {right && <div style={{ paddingRight: 8 }}>{right}</div>}
      </div>
      {open && <div className="fsec-body">{children}</div>}
    </div>
  );
}

// ── Toasts ───────────────────────────────────────────────────────────────

export interface Toast {
  id: number;
  msg: string;
  kind: 'ok' | 'err' | 'info';
}

let toastId = 0;
const listeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];

export function toast(msg: string, kind: Toast['kind'] = 'info') {
  const t: Toast = { id: ++toastId, msg, kind };
  toasts = [...toasts, t];
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((x) => x.id !== t.id);
    listeners.forEach((l) => l(toasts));
  }, kind === 'err' ? 6000 : 3200);
}

export function ToastHost() {
  const [items, setItems] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);
  if (!items.length) return null;
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.kind === 'err' ? 'err' : t.kind === 'ok' ? 'ok' : ''}`}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Confirm ──────────────────────────────────────────────────────────────

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width={420}
      footer={
        <>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--tx-2)', lineHeight: 1.55 }}>{message}</p>
    </Modal>
  );
}
