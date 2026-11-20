'use client';

import React, { useEffect, useRef, useState } from 'react';

export type VenueApiKey = {
  id: string;
  name: string;
  apiKey: string;
  venueId: string;
  expiryOption: 'NO_EXPIRE' | 'ONE_DAY' | 'ONE_WEEK' | 'ONE_MONTH';
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  apiKey: VenueApiKey;
  venueName: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
};

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* fallback silent */
    }
  };
  return { copied, copy };
}

export default function ApiKeyDetailModal({ apiKey, venueName, onClose, onDelete }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { copied, copy } = useCopy();

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const projectName = `projects/${apiKey.venueId}`;
  const projectNumber = apiKey.venueId;

  const curlSnippet = `curl -H "Authorization: Bearer ${apiKey.apiKey}" \\
  https://api.speakeasypos.com/v1/venues/${apiKey.venueId}`;

  async function doDelete() {
    setConfirmOpen(false);
    setDeleting(true);
    try {
      await onDelete(apiKey.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div ref={backdropRef} style={s.backdrop} onClick={handleBackdropClick}>
      <div style={s.panel} role="dialog" aria-modal="true" aria-label="API key details">
        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>API key details</span>
          <button id="api-detail-close" style={s.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={s.divider} />

        {/* Rows */}
        <div style={s.rows}>
          <DetailRow
            label="API Key"
            value={apiKey.apiKey}
            display={maskKey(apiKey.apiKey)}
            copyKey="apiKey"
            copied={copied}
            onCopy={copy}
          />
          <DetailRow
            label="Name"
            value={apiKey.name}
            copyKey="name"
            copied={copied}
            onCopy={copy}
          />
          <DetailRow
            label="Project name"
            value={projectName}
            copyKey="projectName"
            copied={copied}
            onCopy={copy}
          />
          <DetailRow
            label="Project number"
            value={projectNumber}
            copyKey="projectNumber"
            copied={copied}
            onCopy={copy}
          />
        </div>

        <div style={s.divider} />

        {/* Footer actions */}
        <div style={s.footer}>
          <button
              id="api-detail-delete"
              style={s.deleteBtn}
              onClick={() => setConfirmOpen(true)}
              disabled={deleting}
            >
              {deleting ? 'Revoking…' : 'Delete key'}
            </button>
          <div style={s.footerRight}>
            <button
              id="api-detail-copy-key"
              style={s.primaryBtn}
              onClick={() => copy(apiKey.apiKey, 'fullKey')}
            >
              {copied === 'fullKey' ? '✓ Copied!' : 'Copy key'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirm panel */}
      {confirmOpen && (
        <div style={s.confirmBackdrop} onClick={e => e.stopPropagation()}>
          <div style={s.confirmPanel}>
            <p style={s.confirmMsg}>Permanently revoke this API key? It will stop working immediately.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelConfirmBtn} onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button style={s.revokeConfirmBtn} onClick={doDelete}>Revoke key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function maskKey(key: string) {
  if (key.length <= 8) return key;
  return key.slice(0, 6) + '••••••••••••••••••••' + key.slice(-6);
}

function DetailRow({
  label,
  value,
  display,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  display?: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isCopied = copied === copyKey;

  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <div style={s.rowValue}>
        <span style={s.rowText}>{display ?? value}</span>
        <button
          style={{ ...s.copyBtn, ...(hovered ? s.copyBtnHover : {}), ...(isCopied ? s.copyBtnCopied : {}) }}
          onClick={() => onCopy(value, copyKey)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title="Copy to clipboard"
          aria-label={`Copy ${label}`}
        >
          {isCopied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0,
    background: 'rgba(8,7,6,0.72)',
    backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, padding: 20,
  },
  panel: {
    width: '100%', maxWidth: 520,
    background: '#1a1814',
    border: '1px solid #2e2a25',
    borderRadius: 14,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    fontFamily: "'DM Sans', sans-serif",
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 24px 16px',
  },
  title: { fontSize: 17, fontWeight: 600, color: '#f0ead6' },
  closeBtn: {
    border: '1px solid #2e2a25', borderRadius: '50%',
    background: '#242018', color: '#9a8f7e',
    width: 30, height: 30,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  },
  divider: { height: 1, background: '#2e2a25' },
  rows: { padding: '8px 0' },
  row: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '14px 24px',
    borderBottom: '1px solid #1f1d1a',
  },
  rowLabel: { fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6a6055', fontWeight: 500 },
  rowValue: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowText: { fontSize: 13, color: '#d3c6a5', fontFamily: "'DM Mono', 'Courier New', monospace", wordBreak: 'break-all' },
  copyBtn: {
    border: '1px solid transparent', borderRadius: 6,
    background: 'transparent', color: '#6a6055',
    padding: '4px 6px', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s',
  },
  copyBtnHover: { background: '#2a2520', borderColor: '#3a342e', color: '#c9a84c' },
  copyBtnCopied: { color: '#5cb97e', borderColor: 'transparent' },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: 10, padding: '16px 24px',
    flexWrap: 'wrap',
  },
  footerRight: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  deleteBtn: {
    padding: '9px 16px', borderRadius: 8,
    border: '1px solid #5a2a2a',
    background: '#2d1a1a', color: '#e07070',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    transition: 'background 0.15s',
  },
  secondaryBtn: {
    padding: '9px 14px', borderRadius: 8,
    border: '1px solid #2e2a25',
    background: '#242018', color: '#c9a84c',
    fontSize: 13, fontWeight: 500, cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },
  primaryBtn: {
    padding: '9px 18px', borderRadius: 8,
    border: 'none',
    background: 'linear-gradient(135deg, #c9a84c, #e8c97a)',
    color: '#0c0b09',
    fontSize: 13, fontWeight: 700, cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'opacity 0.15s',
  },
  confirmBackdrop: { position: 'fixed', inset: 0, background: 'rgba(8,7,6,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 },
  confirmPanel: { background: '#1a1814', border: '1px solid #2e2a25', borderRadius: 14, padding: '26px 30px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', fontFamily: "'DM Sans',sans-serif" },
  confirmMsg: { margin: '0 0 22px', fontSize: 14, color: '#d3c6a5', lineHeight: 1.65 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelConfirmBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #2a2520', background: 'transparent', color: '#7a6f5e', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  revokeConfirmBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #5a2a2a', background: '#2d1a1a', color: '#e07070', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
};
