'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiDelete, apiGet, apiPost } from '@/app/lib/api';
import ApiKeyDetailModal, { VenueApiKey } from './ApiKeyDetailModal';

type Venue = { id: string; venueName: string };

type Props = {
  venue: Venue;
  onClose: () => void;
};

const EXPIRY_OPTIONS = [
  { value: 'NO_EXPIRE', label: 'Never expires' },
  { value: 'ONE_DAY',   label: '1 Day' },
  { value: 'ONE_WEEK',  label: '1 Week' },
  { value: 'ONE_MONTH', label: '1 Month' },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncateKey(key: string) {
  return key.length > 4 ? `...${key.slice(-4)}` : key;
}

/* ── tiny icon helpers ── */
function IconCopy({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}
function IconDollar({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 0 0 7H6" />
    </svg>
  );
}
function IconChart({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconDots({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  );
}
function IconKey({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5" /><path d="M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}

export default function ApiKeysModal({ venue, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [keys, setKeys] = useState<VenueApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* create-key sub-modal */
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createExpiry, setCreateExpiry] = useState<string>('NO_EXPIRE');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newKeyResult, setNewKeyResult] = useState<string | null>(null);

  /* detail modal */
  const [detailKey, setDetailKey] = useState<VenueApiKey | null>(null);

  /* three-dot menus */
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /* copy toast */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  /* confirm revoke dialog */
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<VenueApiKey[]>(`/admin/venue-api-keys?venueId=${venue.id}`);
      setKeys(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load API keys.');
    } finally {
      setLoading(false);
    }
  }, [venue.id]);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  /* close on Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (detailKey) setDetailKey(null); else onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, detailKey]);

  /* close dot-menu on outside click */
  useEffect(() => {
    const h = () => setOpenMenu(null);
    if (openMenu) window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [openMenu]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current && !detailKey) onClose();
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) { setCreateError('Name is required.'); return; }
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const result = await apiPost<VenueApiKey>('/admin/venue-api-keys', {
        name: createName.trim(),
        venueId: venue.id,
        expiryOption: createExpiry,
      });
      setNewKeyResult(result.apiKey);
      setCreateName('');
      setCreateExpiry('NO_EXPIRE');
      fetchKeys();
    } catch (err) {
      setCreateError((err as Error).message || 'Failed to create API key.');
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function handleRevoke(id: string) {
    await apiDelete(`/admin/venue-api-keys/${id}`);
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    });
  }

  const visibleKeys = keys.filter(k => !k.isDeleted);

  return (
    <div ref={backdropRef} style={s.backdrop} onClick={handleBackdropClick}>
      <div style={s.panel} role="dialog" aria-modal="true" aria-label="API Keys">

        {/* ── HEADER ── */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <h2 style={s.title}>API Keys</h2>
          </div>
          <div style={s.headerRight}>
            <button id="api-keys-create" style={s.goldBtn} onClick={() => { setCreateOpen(true); setNewKeyResult(null); }}>
              <IconKey />
              <span>Create API key</span>
            </button>
            <button id="api-keys-close" style={s.xBtn} onClick={onClose} aria-label="Close">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div style={s.toolbar}>
          <div style={s.groupBy}>
            <span style={s.toolbarLabel}>Group by</span>
            <button style={s.groupChipActive}>● API Key</button>
          </div>
          <div style={s.filterBy}>
            <span style={s.toolbarLabel}>Filter by</span>
            <div style={s.filterSelect}>All projects <span style={{ marginLeft: 6, opacity: 0.5 }}>▾</span></div>
          </div>
        </div>

        <div style={s.divider} />

        {/* ── TABLE ── */}
        <div style={s.tableWrap}>
          {error && <div style={s.errorBanner}>{error}</div>}

          {loading ? (
            <div style={s.stateMsg}>Loading keys…</div>
          ) : visibleKeys.length === 0 ? (
            <div style={s.stateMsg}>No API keys yet. Click <strong>Create API key</strong> to get started.</div>
          ) : (
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Key</th>
                  <th style={s.th}>Project</th>
                  <th style={s.th}>Created</th>
                  <th style={s.th}>Billing Tier</th>
                  <th style={{ ...s.th, width: 130 }}></th>
                </tr>
              </thead>
              <tbody>
                {visibleKeys.map(k => (
                  <tr key={k.id} style={s.tr}>
                    <td style={s.td}>
                      <button style={s.keyBtn} onClick={() => setDetailKey(k)}>
                        <span style={s.keyChip}>{truncateKey(k.apiKey)}</span>
                        <span style={s.keyName}>{k.name}</span>
                      </button>
                    </td>
                    <td style={s.td}>
                      <span style={s.projectName}>{venue.venueName}</span>
                      <span style={s.projectId}>{venue.id.slice(0, 22)}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.dateText}>{formatDate(k.createdAt)}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.billingLink}>Set up billing</span>
                      <span style={s.billingTier}>Free tier</span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <div style={s.actionRow}>
                        {/* Copy */}
                        <button
                          style={{ ...s.iconBtn, ...(copiedId === k.id ? s.iconBtnCopied : {}) }}
                          title="Copy key"
                          onClick={() => copyToClipboard(k.apiKey, k.id)}
                        >
                          {copiedId === k.id
                            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                            : <IconCopy size={14} />}
                        </button>
                        {/* Billing noop */}
                        <button style={s.iconBtn} title="Billing"><IconDollar size={14} /></button>
                        {/* Usage noop */}
                        <button style={s.iconBtn} title="Usage"><IconChart size={14} /></button>
                        {/* Three-dot */}
                        <div style={{ position: 'relative' }}>
                          <button
                            style={s.iconBtn}
                            title="More options"
                            onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === k.id ? null : k.id); }}
                          >
                            <IconDots size={14} />
                          </button>
                          {openMenu === k.id && (
                            <div style={s.dropMenu} onClick={e => e.stopPropagation()}>
                              <button style={s.dropItem} onClick={() => { setDetailKey(k); setOpenMenu(null); }}>
                                View details
                              </button>
                              <button style={s.dropItemDanger} onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                setConfirmRevokeId(k.id);
                              }}>
                                Revoke / Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── CREATE KEY SUB-MODAL ── */}
      {createOpen && (
        <div style={s.subBackdrop} onClick={e => { if (e.target === e.currentTarget) { setCreateOpen(false); setNewKeyResult(null); } }}>
          <div style={s.subPanel}>
            <div style={s.subHeader}>
              <span style={s.subTitle}>{newKeyResult ? 'API Key Created' : 'Create API Key'}</span>
              <button style={s.xBtn} onClick={() => { setCreateOpen(false); setNewKeyResult(null); }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div style={s.divider} />

            {newKeyResult ? (
              <div style={s.subBody}>
                <p style={s.newKeyNote}>
                  ⚠ Copy your API key now. You won&apos;t be able to see it again.
                </p>
                <div style={s.newKeyBox}>
                  <code style={s.newKeyCode}>{newKeyResult}</code>
                  <button style={s.newKeyCopy} onClick={() => copyToClipboard(newKeyResult, 'new')}>
                    {copiedId === 'new' ? '✓' : <IconCopy size={13} />}
                  </button>
                </div>
                <div style={s.subFooter}>
                  <button style={s.goldBtn} onClick={() => { setCreateOpen(false); setNewKeyResult(null); }}>Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} style={s.subBody}>
                <label style={s.fieldLabel}>
                  Key name
                  <input
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    placeholder="e.g. Production Key"
                    style={s.fieldInput}
                    autoFocus
                  />
                </label>
                <label style={s.fieldLabel}>
                  Expiration
                  <select value={createExpiry} onChange={e => setCreateExpiry(e.target.value)} style={s.fieldInput}>
                    {EXPIRY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </label>
                {createError && <p style={s.formErr}>{createError}</p>}
                <div style={s.subFooter}>
                  <button type="button" style={s.cancelBtn} onClick={() => setCreateOpen(false)}>Cancel</button>
                  <button type="submit" style={s.goldBtn} disabled={createSubmitting}>
                    {createSubmitting ? 'Creating…' : 'Create key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {detailKey && (
        <ApiKeyDetailModal
          apiKey={detailKey}
          venueName={venue.venueName}
          onClose={() => setDetailKey(null)}
          onDelete={handleRevoke}
        />
      )}

      {/* ── REVOKE CONFIRM DIALOG ── */}
      {confirmRevokeId && (
        <div style={s.confirmBackdrop} onClick={e => e.stopPropagation()}>
          <div style={s.confirmPanel}>
            <p style={s.confirmMsg}>Revoke this API key? It will stop working immediately and cannot be undone.</p>
            <div style={s.confirmActions}>
              <button style={s.cancelConfirmBtn} onClick={() => setConfirmRevokeId(null)}>Cancel</button>
              <button style={s.revokeConfirmBtn} onClick={async () => {
                const id = confirmRevokeId;
                setConfirmRevokeId(null);
                await handleRevoke(id);
              }}>Revoke key</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── styles ─── */
const s: Record<string, React.CSSProperties> = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(8,7,6,0.80)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 },
  panel: { width: '100%', maxWidth: 900, background: '#141210', border: '1px solid #2a2520', borderRadius: 16, boxShadow: '0 32px 90px rgba(0,0,0,0.6)', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 12px', flexWrap: 'wrap', gap: 10 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10 },
  title: { margin: 0, fontSize: 22, fontWeight: 600, color: '#f0ead6' },
  ghostBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #2a2520', background: 'transparent', color: '#9a8f7e', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  goldBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', color: '#0c0b09', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' },
  xBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, border: '1px solid #2a2520', borderRadius: '50%', background: '#1f1d1a', color: '#9a8f7e', cursor: 'pointer' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px 14px', flexWrap: 'wrap', gap: 12 },
  groupBy: { display: 'flex', alignItems: 'center', gap: 8 },
  filterBy: { display: 'flex', alignItems: 'center', gap: 8 },
  toolbarLabel: { fontSize: 12, color: '#6a6055', letterSpacing: '0.04em' },
  groupChipActive: { padding: '5px 14px', borderRadius: 20, border: '1px solid #c9a84c', background: 'rgba(201,168,76,0.1)', color: '#c9a84c', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  groupChip: { padding: '5px 14px', borderRadius: 20, border: '1px solid #2a2520', background: 'transparent', color: '#7a6f5e', fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  filterSelect: { padding: '6px 12px', borderRadius: 8, border: '1px solid #2a2520', background: '#1a1814', color: '#d3c6a5', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  divider: { height: 1, background: '#2a2520', flexShrink: 0 },
  tableWrap: { overflowY: 'auto', flex: 1 },
  errorBanner: { margin: 16, padding: '12px 16px', borderRadius: 8, background: '#2d1a1a', border: '1px solid #5a2a2a', color: '#e07070', fontSize: 13 },
  stateMsg: { padding: '48px 24px', color: '#6a6055', fontSize: 14, textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '14px 20px 10px', textAlign: 'left', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#6a6055', borderBottom: '1px solid #2a2520', fontWeight: 500 },
  tr: { borderBottom: '1px solid #1f1d1a', transition: 'background 0.1s' },
  td: { padding: '14px 20px', verticalAlign: 'middle' },
  keyBtn: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' },
  keyChip: { display: 'block', fontSize: 14, fontWeight: 600, color: '#7ba7f5', fontFamily: "'DM Mono','Courier New',monospace", letterSpacing: '0.03em', textDecoration: 'underline', textUnderlineOffset: 3 },
  keyName: { display: 'block', fontSize: 12, color: '#6a6055', marginTop: 2 },
  projectName: { display: 'block', fontSize: 13, color: '#7ba7f5', fontWeight: 500 },
  projectId: { display: 'block', fontSize: 11, color: '#6a6055', marginTop: 2, fontFamily: "'DM Mono','Courier New',monospace" },
  dateText: { fontSize: 13, color: '#c9c0ad' },
  billingLink: { display: 'block', fontSize: 13, color: '#7ba7f5', cursor: 'pointer' },
  billingTier: { display: 'block', fontSize: 11, color: '#6a6055', marginTop: 2 },
  actionRow: { display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  iconBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid transparent', background: 'transparent', color: '#6a6055', cursor: 'pointer', transition: 'all 0.15s' },
  iconBtnCopied: { color: '#5cb97e' },
  dropMenu: { position: 'absolute', right: 0, top: '110%', zIndex: 50, background: '#1f1d1a', border: '1px solid #2a2520', borderRadius: 8, minWidth: 150, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', overflow: 'hidden' },
  dropItem: { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', color: '#d3c6a5', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  dropItemDanger: { display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'transparent', border: 'none', color: '#e07070', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  // create sub-modal
  subBackdrop: { position: 'fixed', inset: 0, background: 'rgba(8,7,6,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150, padding: 20 },
  subPanel: { width: '100%', maxWidth: 460, background: '#1a1814', border: '1px solid #2e2a25', borderRadius: 14, boxShadow: '0 24px 70px rgba(0,0,0,0.5)', fontFamily: "'DM Sans',sans-serif", overflow: 'hidden' },
  subHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px' },
  subTitle: { fontSize: 16, fontWeight: 600, color: '#f0ead6' },
  subBody: { padding: '18px 22px', display: 'grid', gap: 16 },
  subFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  fieldLabel: { display: 'grid', gap: 7, fontSize: 12, fontWeight: 500, color: '#9a8f7e', letterSpacing: '0.04em' },
  fieldInput: { width: '100%', minHeight: 42, padding: '10px 13px', borderRadius: 8, border: '1px solid #2a2520', background: '#0f0e0c', color: '#f0ead6', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" },
  formErr: { margin: 0, color: '#e07070', fontSize: 13 },
  cancelBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #2a2520', background: 'transparent', color: '#7a6f5e', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  newKeyNote: { margin: 0, fontSize: 13, color: '#c9a84c', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px' },
  newKeyBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#0f0e0c', border: '1px solid #2a2520', borderRadius: 8, padding: '10px 14px' },
  newKeyCode: { flex: 1, fontSize: 12, color: '#c9a84c', fontFamily: "'DM Mono','Courier New',monospace", wordBreak: 'break-all', background: 'none', border: 'none' },
  newKeyCopy: { flexShrink: 0, padding: '4px 6px', borderRadius: 6, border: '1px solid #2a2520', background: '#1a1814', color: '#9a8f7e', cursor: 'pointer' },
  // confirm revoke
  confirmBackdrop: { position: 'fixed', inset: 0, background: 'rgba(8,7,6,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 250, padding: 20 },
  confirmPanel: { background: '#1a1814', border: '1px solid #2e2a25', borderRadius: 14, padding: '26px 30px', maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', fontFamily: "'DM Sans',sans-serif" },
  confirmMsg: { margin: '0 0 22px', fontSize: 14, color: '#d3c6a5', lineHeight: 1.65 },
  confirmActions: { display: 'flex', justifyContent: 'flex-end', gap: 10 },
  cancelConfirmBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #2a2520', background: 'transparent', color: '#7a6f5e', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
  revokeConfirmBtn: { padding: '9px 16px', borderRadius: 8, border: '1px solid #5a2a2a', background: '#2d1a1a', color: '#e07070', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" },
};
