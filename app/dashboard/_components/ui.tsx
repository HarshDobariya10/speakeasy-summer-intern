'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, Eye, EyeOff, X, XCircle } from 'lucide-react';
import { keyStatus, POS_LABELS, type KeyStatus, type PosProvider, type VenueApiKey } from '@/app/lib/speakeasy';

/* ───────────────────────── Toasts ───────────────────────── */

type Toast = { id: number; kind: 'success' | 'error'; text: string };
const ToastCtx = createContext<(kind: Toast['kind'], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="se-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`se-toast ${t.kind}`}>
            {t.kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ───────────────────────── Modal ───────────────────────── */

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  size,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm';
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="se-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`se-modal ${size ?? ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="se-modal-head">
          <div>
            <h2 className="se-modal-title">{title}</h2>
            {subtitle ? <p className="se-subtitle" style={{ marginTop: 4 }}>{subtitle}</p> : null}
          </div>
          <button className="se-btn ghost icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="se-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Modal title={title} onClose={onClose} size="sm">
      <div className="se-form">
        <div className="se-alert warn">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>{message}</div>
        </div>
        {error ? <div className="se-alert error">{error}</div> : null}
        <div className="se-modal-foot">
          <button className="se-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className="se-btn danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await onConfirm();
                onClose();
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Small pieces ───────────────────────── */

export function CopyButton({ value, label, size = 'sm' }: { value: string; label?: string; size?: 'sm' | 'icon' }) {
  const [done, setDone] = useState(false);
  const toast = useToast();
  return (
    <button
      type="button"
      className={`se-btn ${size === 'icon' ? 'ghost icon' : 'sm'}`}
      title="Copy to clipboard"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast('success', 'Copied to clipboard');
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast('error', 'Clipboard not available');
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {label && size !== 'icon' ? <span>{done ? 'Copied' : label}</span> : null}
    </button>
  );
}

export function SecretValue({ value, masked }: { value: string; masked: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="se-secret">
      <code>{show ? value : masked}</code>
      <button type="button" className="se-btn ghost icon" onClick={() => setShow((s) => !s)} title={show ? 'Hide' : 'Reveal'}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <CopyButton value={value} size="icon" />
    </div>
  );
}

export function PosMark({ provider, withLabel = true }: { provider: PosProvider; withLabel?: boolean }) {
  return (
    <span className="se-pos">
      <span className={`se-pos-mark ${provider}`}>{provider[0]}</span>
      {withLabel ? <span>{POS_LABELS[provider]}</span> : null}
    </span>
  );
}

const STATUS_BADGE: Record<KeyStatus, { cls: string; text: string }> = {
  active: { cls: 'green', text: 'Active' },
  expiring: { cls: 'amber', text: 'Expiring soon' },
  expired: { cls: 'red', text: 'Expired' },
};

export function KeyStatusBadge({ k }: { k: Pick<VenueApiKey, 'expiresAt'> }) {
  const s = STATUS_BADGE[keyStatus(k)];
  return (
    <span className={`se-badge ${s.cls}`}>
      <span className="dot" />
      {s.text}
    </span>
  );
}

export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="se-empty">
      <div className="se-empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function Skeleton({ w = '100%', h = 14, style }: { w?: number | string; h?: number; style?: React.CSSProperties }) {
  return <div className="se-skel" style={{ width: w, height: h, ...style }} />;
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ padding: '8px 22px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
          <Skeleton w={28} h={28} />
          <Skeleton w="30%" />
          <Skeleton w="18%" />
          <Skeleton w="14%" style={{ marginLeft: 'auto' }} />
        </div>
      ))}
    </div>
  );
}

export function Menu({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="se-menu-wrap" ref={ref} onClick={(e) => e.stopPropagation()}>
      <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      {open ? (
        <div className="se-menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
