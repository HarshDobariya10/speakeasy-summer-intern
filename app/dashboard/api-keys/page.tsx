'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, MoreHorizontal, Pencil, Search, Store, Trash2 } from 'lucide-react';
import {
  EXPIRY_LABELS,
  deleteVenueKey,
  formatDate,
  keyStatus,
  listAllVenuesWithKeys,
  maskKey,
  timeUntil,
  type KeyStatus,
  type Venue,
  type VenueApiKey,
} from '@/app/lib/speakeasy';
import { ConfirmDialog, CopyButton, Empty, KeyStatusBadge, Menu, PosMark, RowsSkeleton, useToast } from '../_components/ui';
import { KeyFormModal } from '../_components/forms';

type Row = VenueApiKey & { venue: Venue };
type Filter = 'all' | KeyStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'expiring', label: 'Expiring soon' },
  { id: 'expired', label: 'Expired' },
];

export default function ApiKeysPage() {
  const router = useRouter();
  const toast = useToast();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [revoking, setRevoking] = useState<Row | null>(null);

  const load = useCallback(
    () =>
      listAllVenuesWithKeys().then(setVenues, (e: Error) => {
        setError(e.message);
        setVenues([]);
      }),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const all: Row[] = useMemo(
    () =>
      (venues ?? [])
        .flatMap((v) => (v.venueApiKeys ?? []).map((k) => ({ ...k, venue: v })))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [venues],
  );

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: all.length, active: 0, expiring: 0, expired: 0 };
    all.forEach((k) => c[keyStatus(k)]++);
    return c;
  }, [all]);

  const q = search.trim().toLowerCase();
  const rows = all.filter(
    (k) =>
      (filter === 'all' || keyStatus(k) === filter) &&
      (venueFilter === 'all' || k.venueId === venueFilter) &&
      (!q || k.name.toLowerCase().includes(q) || k.venue.venueName.toLowerCase().includes(q) || k.apiKey.includes(q)),
  );

  return (
    <>
      <div className="se-crumbs"><Link href="/dashboard">Dashboard</Link> / <span>API Keys</span></div>
      <div className="se-head">
        <div>
          <h1 className="se-title">API keys</h1>
          <p className="se-subtitle">Every <span className="se-mono">spk_</span> key issued across all venues. Track expiry, rotate validity and revoke access in one place.</p>
        </div>
      </div>

      {error ? <div className="se-alert error" style={{ marginBottom: 16 }}>{error}</div> : null}

      <section className="se-card">
        <div className="se-toolbar">
          <div className="se-tabs">
            {FILTERS.map((f) => (
              <button key={f.id} className={`se-tab ${filter === f.id ? 'on' : ''}`} onClick={() => setFilter(f.id)}>
                {f.label} <span className="n">{counts[f.id]}</span>
              </button>
            ))}
          </div>
          <select className="se-select sm" value={venueFilter} onChange={(e) => setVenueFilter(e.target.value)}>
            <option value="all">All venues</option>
            {(venues ?? []).map((v) => <option key={v.id} value={v.id}>{v.venueName}</option>)}
          </select>
          <div className="se-search" style={{ marginLeft: 'auto' }}>
            <Search size={15} />
            <input className="se-input" placeholder="Search key or venue…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {venues === null ? (
          <RowsSkeleton />
        ) : all.length === 0 ? (
          <Empty
            icon={<KeyRound size={22} />}
            title="No API keys issued"
            text="Open a venue and generate its first key. Every key appears here."
            action={<Link className="se-btn primary" href="/dashboard/venues"><Store size={15} /> Go to venues</Link>}
          />
        ) : rows.length === 0 ? (
          <div className="se-empty" style={{ padding: 40 }}>No keys match these filters.</div>
        ) : (
          <div className="se-table-wrap">
            <table className="se-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Venue</th>
                  <th>Secret</th>
                  <th>Status</th>
                  <th>Validity</th>
                  <th>Created</th>
                  <th className="r" style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => (
                  <tr key={k.id} className="clickable" onClick={() => router.push(`/dashboard/venues/${k.venueId}`)}>
                    <td><div className="se-strong">{k.name}</div></td>
                    <td><span className="se-pos"><PosMark provider={k.venue.posProvider} withLabel={false} /> {k.venue.venueName}</span></td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span className="se-mono se-dim">{maskKey(k.apiKey)}</span>
                        <CopyButton value={k.apiKey} size="icon" />
                      </span>
                    </td>
                    <td><KeyStatusBadge k={k} /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div>{EXPIRY_LABELS[k.expiryOption]}</div>
                      <div className="se-dim">{timeUntil(k.expiresAt)}</div>
                    </td>
                    <td className="se-dim" style={{ whiteSpace: 'nowrap' }}>{formatDate(k.createdAt)}</td>
                    <td className="r">
                      <Menu trigger={<button className="se-btn ghost icon" aria-label="Key actions"><MoreHorizontal size={16} /></button>}>
                        <button onClick={() => setEditing(k)}><Pencil size={14} /> Edit / renew</button>
                        <button onClick={() => router.push(`/dashboard/venues/${k.venueId}`)}><Store size={14} /> Open venue</button>
                        <button className="danger" onClick={() => setRevoking(k)}><Trash2 size={14} /> Revoke</button>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <KeyFormModal venueId={editing.venueId} venueName={editing.venue.venueName} existing={editing} onClose={() => setEditing(null)} onSaved={() => load()} />
      ) : null}

      {revoking ? (
        <ConfirmDialog
          title="Revoke API key?"
          message={<>Integrations at <b>{revoking.venue.venueName}</b> using “{revoking.name}” will lose access immediately.</>}
          confirmLabel="Revoke key"
          onClose={() => setRevoking(null)}
          onConfirm={async () => {
            await deleteVenueKey(revoking.id);
            toast('success', 'API key revoked');
            load();
          }}
        />
      ) : null}
    </>
  );
}
