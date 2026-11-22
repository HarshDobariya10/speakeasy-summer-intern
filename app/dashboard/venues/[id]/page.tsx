'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, MoreHorizontal, Pencil, Plus, RotateCw, ShieldCheck, Trash2 } from 'lucide-react';
import {
  AUTH_LABELS,
  CREDENTIAL_FIELDS,
  EXPIRY_LABELS,
  POS_LABELS,
  deleteVenue,
  deleteVenueKey,
  formatDate,
  getVenue,
  keyStatus,
  listVenueKeys,
  maskKey,
  maskSecret,
  timeAgo,
  timeUntil,
  type Venue,
  type VenueApiKey,
} from '@/app/lib/speakeasy';
import { ConfirmDialog, CopyButton, Empty, KeyStatusBadge, Menu, PosMark, RowsSkeleton, SecretValue, Skeleton, useToast } from '../../_components/ui';
import { KeyFormModal, VenueFormModal } from '../../_components/forms';

type Filter = 'all' | 'active' | 'attention';

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [keys, setKeys] = useState<VenueApiKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [editVenue, setEditVenue] = useState(false);
  const [deletingVenue, setDeletingVenue] = useState(false);
  const [keyModal, setKeyModal] = useState<VenueApiKey | 'new' | null>(null);
  const [revoking, setRevoking] = useState<VenueApiKey | null>(null);

  const loadKeys = useCallback(
    () =>
      listVenueKeys(id).then(
        (k) => setKeys(k.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())),
        (e: Error) => {
          setError(e.message);
          setKeys([]);
        },
      ),
    [id],
  );

  useEffect(() => {
    getVenue(id).then(setVenue).catch((e) => setError((e as Error).message));
    loadKeys();
  }, [id, loadKeys]);

  const counts = useMemo(() => {
    const c = { all: keys?.length ?? 0, active: 0, attention: 0 };
    keys?.forEach((k) => (keyStatus(k) === 'active' ? c.active++ : c.attention++));
    return c;
  }, [keys]);

  const shown = (keys ?? []).filter((k) =>
    filter === 'all' ? true : filter === 'active' ? keyStatus(k) === 'active' : keyStatus(k) !== 'active',
  );

  if (error && !venue) {
    return (
      <>
        <Link href="/dashboard/venues" className="se-btn ghost" style={{ marginBottom: 20 }}><ArrowLeft size={14} /> Back to venues</Link>
        <section className="se-card">
          <Empty icon={<ShieldCheck size={22} />} title="Venue not found" text={error} action={<Link className="se-btn" href="/dashboard/venues">View all venues</Link>} />
        </section>
      </>
    );
  }

  const credFields = venue && venue.apiKeyType !== 'CUSTOM_HEADERS' ? CREDENTIAL_FIELDS[venue.apiKeyType] : [];
  const customHeaders = venue?.apiKeyType === 'CUSTOM_HEADERS' ? ((venue.apiKey?.headers ?? {}) as Record<string, string>) : {};

  return (
    <>
      <div className="se-crumbs">
        <Link href="/dashboard">Dashboard</Link> / <Link href="/dashboard/venues">Venues</Link> / <span>{venue?.venueName ?? '…'}</span>
      </div>

      <div className="se-head">
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {venue ? (
            <span className={`se-pos-mark ${venue.posProvider}`} style={{ width: 56, height: 56, fontSize: 28, borderRadius: 14 }}>{venue.posProvider[0]}</span>
          ) : (
            <Skeleton w={56} h={56} />
          )}
          <div>
            {venue ? <h1 className="se-title">{venue.venueName}</h1> : <Skeleton w={260} h={36} />}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {venue ? (
                <>
                  <span className="se-badge neutral">{POS_LABELS[venue.posProvider]}</span>
                  <span className="se-badge neutral">{AUTH_LABELS[venue.apiKeyType]}</span>
                  <span className="se-badge green"><span className="dot" /> Connected {timeAgo(venue.createdAt)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="se-head-actions">
          <button className="se-btn" disabled={!venue} onClick={() => setEditVenue(true)}><Pencil size={14} /> Edit</button>
          <button className="se-btn danger" disabled={!venue} onClick={() => setDeletingVenue(true)}><Trash2 size={14} /> Delete</button>
        </div>
      </div>

      <div className="se-grid two">
        {/* ── API keys ── */}
        <section className="se-card" style={{ alignSelf: 'start' }}>
          <div className="se-card-head" style={{ flexWrap: 'wrap' }}>
            <div>
              <h2 className="se-card-title">API keys</h2>
              <div className="se-card-sub">Keys this venue’s apps use to call Speakeasy</div>
            </div>
            <button className="se-btn primary sm" disabled={!venue} onClick={() => setKeyModal('new')}><Plus size={14} /> Generate key</button>
          </div>
          {keys && keys.length > 0 ? (
            <div className="se-toolbar">
              <div className="se-tabs">
                {(['all', 'active', 'attention'] as Filter[]).map((f) => (
                  <button key={f} className={`se-tab ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                    {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Expiring / expired'} <span className="n">{counts[f]}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {keys === null ? (
            <RowsSkeleton rows={3} />
          ) : keys.length === 0 ? (
            <Empty
              icon={<KeyRound size={22} />}
              title="No API keys yet"
              text="Generate a key so this venue’s POS integration can authenticate with Speakeasy."
              action={<button className="se-btn primary" onClick={() => setKeyModal('new')}><Plus size={15} /> Generate first key</button>}
            />
          ) : shown.length === 0 ? (
            <div className="se-empty" style={{ padding: 36 }}>No keys in this filter.</div>
          ) : (
            <div className="se-list">
              {shown.map((k) => (
                <div className="se-list-item" key={k.id} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                    <div className="se-list-main">
                      <div className="se-list-title">{k.name}</div>
                      <div className="se-dim">Created {formatDate(k.createdAt)} · {EXPIRY_LABELS[k.expiryOption]}</div>
                    </div>
                    <KeyStatusBadge k={k} />
                    <Menu trigger={<button className="se-btn ghost icon" aria-label="Key actions"><MoreHorizontal size={16} /></button>}>
                      <button onClick={() => setKeyModal(k)}><Pencil size={14} /> Rename</button>
                      <button onClick={() => setKeyModal(k)}><RotateCw size={14} /> Change validity</button>
                      <button className="danger" onClick={() => setRevoking(k)}><Trash2 size={14} /> Revoke</button>
                    </Menu>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <div className="se-secret" style={{ flex: 1, minWidth: 220 }}>
                      <code>{maskKey(k.apiKey)}</code>
                      <CopyButton value={k.apiKey} size="icon" />
                    </div>
                    <span className="se-dim" style={{ minWidth: 130, textAlign: 'right' }}>{timeUntil(k.expiresAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Connection details ── */}
        <div className="se-grid" style={{ alignSelf: 'start' }}>
          <section className="se-card">
            <div className="se-card-head"><h2 className="se-card-title">Connection</h2></div>
            <div className="se-card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
              {venue ? (
                <div className="se-kv">
                  <div className="k">POS provider</div><div className="v"><PosMark provider={venue.posProvider} /></div>
                  <div className="k">Auth method</div><div className="v">{AUTH_LABELS[venue.apiKeyType]}</div>
                  <div className="k">Venue ID</div>
                  <div className="v" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="se-mono">{venue.id}</span>
                  </div>
                  <div className="k">Connected</div><div className="v">{formatDate(venue.createdAt, true)}</div>
                  <div className="k">Last updated</div><div className="v">{formatDate(venue.updatedAt, true)}</div>
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 14, padding: '12px 0' }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} />)}</div>
              )}
            </div>
          </section>

          <section className="se-card">
            <div className="se-card-head">
              <div>
                <h2 className="se-card-title">POS credentials</h2>
                <div className="se-card-sub">Used by Speakeasy to reach the venue’s POS</div>
              </div>
              <ShieldCheck size={18} color="var(--gold)" />
            </div>
            <div className="se-card-pad" style={{ display: 'grid', gap: 14 }}>
              {!venue ? (
                <Skeleton h={38} />
              ) : venue.apiKeyType === 'CUSTOM_HEADERS' ? (
                Object.entries(customHeaders).map(([h, v]) => (
                  <div className="se-field" key={h}>
                    <span className="se-field-label se-mono">{h}</span>
                    <SecretValue value={String(v)} masked={maskSecret(String(v))} />
                  </div>
                ))
              ) : (
                credFields.map((f) => {
                  const v = String(venue.apiKey?.[f.key] ?? '');
                  return (
                    <div className="se-field" key={f.key}>
                      <span className="se-field-label">{f.label}</span>
                      {f.secret ? (
                        <SecretValue value={v} masked={maskSecret(v)} />
                      ) : (
                        <div className="se-secret"><code style={{ color: 'var(--text)' }}>{v || '—'}</code><CopyButton value={v} size="icon" /></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      {editVenue && venue ? (
        <VenueFormModal venue={venue} onClose={() => setEditVenue(false)} onSaved={(v) => setVenue(v)} />
      ) : null}

      {deletingVenue && venue ? (
        <ConfirmDialog
          title="Delete venue?"
          message={<>“{venue.venueName}” and its connection details will be removed. Its {counts.all} API key{counts.all === 1 ? '' : 's'} will no longer be managed.</>}
          onClose={() => setDeletingVenue(false)}
          onConfirm={async () => {
            await deleteVenue(venue.id);
            toast('success', 'Venue deleted');
            router.push('/dashboard/venues');
          }}
        />
      ) : null}

      {keyModal && venue ? (
        <KeyFormModal
          venueId={venue.id}
          venueName={venue.venueName}
          existing={keyModal === 'new' ? undefined : keyModal}
          onClose={() => setKeyModal(null)}
          onSaved={() => loadKeys()}
        />
      ) : null}

      {revoking ? (
        <ConfirmDialog
          title="Revoke API key?"
          message={<>Any integration using <b>{revoking.name}</b> ({maskKey(revoking.apiKey)}) will stop working immediately.</>}
          confirmLabel="Revoke key"
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            await deleteVenueKey(revoking.id);
            toast('success', 'API key revoked');
            loadKeys();
          }}
        />
      ) : null}
    </>
  );
}
