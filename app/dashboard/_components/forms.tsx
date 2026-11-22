'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import {
  API_KEY_TYPES,
  AUTH_LABELS,
  CREDENTIAL_FIELDS,
  EXPIRY_LABELS,
  EXPIRY_OPTIONS,
  POS_LABELS,
  POS_PROVIDERS,
  createVenue,
  createVenueKey,
  updateVenue,
  updateVenueKey,
  type ApiKeyExpiration,
  type ApiKeyType,
  type PosProvider,
  type Venue,
  type VenueApiKey,
} from '@/app/lib/speakeasy';
import { CopyButton, Modal, PosMark, useToast } from './ui';

/* ───────────────────────── Venue create / edit ───────────────────────── */

const AUTH_HINTS: Record<ApiKeyType, string> = {
  API_KEY: 'Static key header',
  BEARER_TOKEN: 'Authorization: Bearer',
  BASIC_AUTH: 'Username + password',
  OAUTH2_CLIENT_CREDENTIALS: 'Machine-to-machine',
  OAUTH2_REFRESH_TOKEN: 'Long-lived refresh',
  JWT: 'Signed token',
  CUSTOM_HEADERS: 'Any header set',
};

type HeaderRow = { k: string; v: string };

function initialCreds(venue?: Venue): Record<string, string> {
  if (!venue) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(venue.apiKey ?? {})) if (typeof v === 'string') out[k] = v;
  return out;
}

function initialHeaders(venue?: Venue): HeaderRow[] {
  const h = venue?.apiKeyType === 'CUSTOM_HEADERS' ? (venue.apiKey?.headers as Record<string, string> | undefined) : undefined;
  const rows = h ? Object.entries(h).map(([k, v]) => ({ k, v: String(v) })) : [];
  return rows.length ? rows : [{ k: '', v: '' }];
}

export function VenueFormModal({
  venue,
  onClose,
  onSaved,
}: {
  venue?: Venue;
  onClose: () => void;
  onSaved: (v: Venue) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(venue?.venueName ?? '');
  const [pos, setPos] = useState<PosProvider>(venue?.posProvider ?? 'TOAST');
  const [auth, setAuth] = useState<ApiKeyType>(venue?.apiKeyType ?? 'API_KEY');
  const [creds, setCreds] = useState<Record<string, string>>(() => initialCreds(venue));
  const [headers, setHeaders] = useState<HeaderRow[]>(() => initialHeaders(venue));
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function buildApiKey(): Record<string, unknown> {
    if (auth === 'CUSTOM_HEADERS') {
      const obj: Record<string, string> = {};
      headers.forEach(({ k, v }) => k.trim() && (obj[k.trim()] = v));
      return { headers: obj };
    }
    const out: Record<string, string> = {};
    CREDENTIAL_FIELDS[auth].forEach((f) => (out[f.key] = (creds[f.key] ?? '').trim()));
    return out;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) return setError('Venue name must be at least 2 characters.');
    const apiKey = buildApiKey();
    if (auth === 'CUSTOM_HEADERS' && Object.keys(apiKey.headers as object).length === 0)
      return setError('Add at least one header.');
    setBusy(true);
    try {
      const body = { venueName: name.trim(), posProvider: pos, apiKeyType: auth, apiKey };
      const saved = venue ? await updateVenue(venue.id, body) : await createVenue(body);
      toast('success', venue ? 'Venue updated' : `“${saved.venueName}” connected`);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title={venue ? 'Edit venue' : 'Connect a venue'}
      subtitle={venue ? 'Update the venue’s POS connection details.' : 'Link a bar or restaurant to its point-of-sale system.'}
      onClose={onClose}
    >
      <form className="se-form" onSubmit={submit}>
        <div className="se-section-label">Venue</div>
        <label className="se-field">
          <span className="se-field-label">Venue name</span>
          <input className="se-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Velvet Room — Bandra" autoFocus />
        </label>

        <div className="se-field">
          <span className="se-field-label">POS provider</span>
          <div className="se-choices" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {POS_PROVIDERS.map((p) => (
              <button type="button" key={p} className={`se-choice ${pos === p ? 'on' : ''}`} onClick={() => setPos(p)}>
                <PosMark provider={p} withLabel={false} />
                <span style={{ display: 'block', marginTop: 8 }}>{POS_LABELS[p]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="se-section-label">Authentication</div>
        <div className="se-choices">
          {API_KEY_TYPES.map((t) => (
            <button type="button" key={t} className={`se-choice ${auth === t ? 'on' : ''}`} onClick={() => setAuth(t)}>
              {AUTH_LABELS[t]}
              <small>{AUTH_HINTS[t]}</small>
            </button>
          ))}
        </div>

        {auth === 'CUSTOM_HEADERS' ? (
          <div className="se-field">
            <span className="se-field-label">Headers sent with every POS request</span>
            {headers.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 8 }}>
                <input
                  className="se-input se-mono"
                  placeholder="X-Api-Key"
                  value={row.k}
                  onChange={(e) => setHeaders((h) => h.map((r, j) => (j === i ? { ...r, k: e.target.value } : r)))}
                />
                <input
                  className="se-input se-mono"
                  placeholder="value"
                  value={row.v}
                  onChange={(e) => setHeaders((h) => h.map((r, j) => (j === i ? { ...r, v: e.target.value } : r)))}
                />
                <button
                  type="button"
                  className="se-btn ghost icon"
                  style={{ height: 40, width: 40 }}
                  disabled={headers.length === 1}
                  onClick={() => setHeaders((h) => h.filter((_, j) => j !== i))}
                  aria-label="Remove header"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button type="button" className="se-btn sm" style={{ justifySelf: 'start' }} onClick={() => setHeaders((h) => [...h, { k: '', v: '' }])}>
              <Plus size={14} /> Add header
            </button>
          </div>
        ) : (
          <div className={CREDENTIAL_FIELDS[auth].length > 1 ? 'se-form-row' : 'se-form'}>
            {CREDENTIAL_FIELDS[auth].map((f) => (
              <label className="se-field" key={f.key} style={f.key === 'tokenUrl' || f.key === 'refreshToken' ? { gridColumn: '1 / -1' } : undefined}>
                <span className="se-field-label">{f.label}</span>
                <div className="se-input-wrap">
                  <input
                    className={`se-input ${f.secret ? 'se-mono' : ''}`}
                    type={f.secret && !reveal[f.key] ? 'password' : 'text'}
                    placeholder={f.placeholder}
                    value={creds[f.key] ?? ''}
                    onChange={(e) => setCreds((c) => ({ ...c, [f.key]: e.target.value }))}
                    autoComplete="off"
                    required
                  />
                  {f.secret ? (
                    <button type="button" className="se-btn ghost icon" style={{ height: 28, width: 28 }} onClick={() => setReveal((r) => ({ ...r, [f.key]: !r[f.key] }))}>
                      {reveal[f.key] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  ) : null}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="se-field-hint" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ShieldCheck size={13} /> Credentials are validated by the server for the selected auth type.
        </div>

        {error ? <div className="se-alert error">{error}</div> : null}

        <div className="se-modal-foot">
          <button type="button" className="se-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="se-btn primary" disabled={busy}>
            {busy ? 'Saving…' : venue ? 'Save changes' : 'Connect venue'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ───────────────────────── API key create / edit ───────────────────────── */

export function KeyFormModal({
  venueId,
  venueName,
  existing,
  onClose,
  onSaved,
}: {
  venueId: string;
  venueName: string;
  existing?: VenueApiKey;
  onClose: () => void;
  onSaved: (k: VenueApiKey) => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(existing?.name ?? '');
  const [expiry, setExpiry] = useState<ApiKeyExpiration>(existing?.expiryOption ?? 'ONE_MONTH');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<VenueApiKey | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Give the key a name so you can recognise it later.');
    setBusy(true);
    setError(null);
    try {
      if (existing) {
        const body: { name?: string; expiryOption?: ApiKeyExpiration } = { name: name.trim() };
        if (expiry !== existing.expiryOption) body.expiryOption = expiry;
        const k = await updateVenueKey(existing.id, body);
        toast('success', 'API key updated');
        onSaved(k);
        onClose();
      } else {
        const k = await createVenueKey({ name: name.trim(), venueId, expiryOption: expiry });
        onSaved(k);
        setCreated(k);
        setBusy(false);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (created) {
    return (
      <Modal title="API key created" subtitle={`For ${venueName}`} onClose={onClose}>
        <div className="se-form">
          <div className="se-alert gold">
            <KeyRound size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>Copy this key now and share it with the venue’s integration. Treat it like a password.</div>
          </div>
          <div className="se-newkey">
            <code>{created.apiKey}</code>
            <CopyButton value={created.apiKey} label="Copy" />
          </div>
          <div className="se-kv">
            <div className="k">Name</div><div className="v">{created.name}</div>
            <div className="k">Validity</div><div className="v">{EXPIRY_LABELS[created.expiryOption]}</div>
          </div>
          <div className="se-modal-foot">
            <button className="se-btn primary" onClick={onClose}>Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={existing ? 'Edit API key' : 'Generate API key'}
      subtitle={existing ? 'Changing validity restarts the expiry clock from now.' : `A secure spk_ key for ${venueName}.`}
      onClose={onClose}
      size="sm"
    >
      <form className="se-form" onSubmit={submit}>
        <label className="se-field">
          <span className="se-field-label">Key name</span>
          <input className="se-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Production — tablet POS" autoFocus />
        </label>
        <div className="se-field">
          <span className="se-field-label">Validity</span>
          <div className="se-choices" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {EXPIRY_OPTIONS.map((o) => (
              <button type="button" key={o} className={`se-choice ${expiry === o ? 'on' : ''}`} onClick={() => setExpiry(o)}>
                {EXPIRY_LABELS[o]}
              </button>
            ))}
          </div>
        </div>
        {error ? <div className="se-alert error">{error}</div> : null}
        <div className="se-modal-foot">
          <button type="button" className="se-btn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="se-btn primary" disabled={busy}>
            {busy ? 'Saving…' : existing ? 'Save' : 'Generate key'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
