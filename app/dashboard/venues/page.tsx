'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, KeyRound, MoreHorizontal, Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import { AUTH_LABELS, deleteVenue, formatDate, listVenues, type Venue } from '@/app/lib/speakeasy';
import { ConfirmDialog, Empty, Menu, PosMark, RowsSkeleton, useToast } from '../_components/ui';
import { VenueFormModal } from '../_components/forms';

const PAGE_SIZE = 10;
type SortField = 'venueName' | 'createdAt' | 'updatedAt';

function SortHead({
  field,
  sort,
  onSort,
  children,
}: {
  field: SortField;
  sort: { field: SortField; dir: 'asc' | 'desc' };
  onSort: (f: SortField) => void;
  children: React.ReactNode;
}) {
  return (
    <button className="se-th-sort" onClick={() => onSort(field)}>
      {children}
      {sort.field === field ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
    </button>
  );
}

export default function VenuesPage() {
  const router = useRouter();
  const toast = useToast();
  const [rows, setRows] = useState<Venue[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [sort, setSort] = useState<{ field: SortField; dir: 'asc' | 'desc' }>({ field: 'createdAt', dir: 'desc' });
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Venue | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Venue | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    () =>
      listVenues({
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
        search: debounced,
        orderBy: `${sort.field}|${sort.dir}`,
        includeKeys: true,
      }).then(
        (res) => {
          setRows(res.list);
          setTotal(res.total);
          setError(null);
        },
        (e: Error) => {
          setError(e.message);
          setRows([]);
        },
      ),
    [page, debounced, sort],
  );

  useEffect(() => {
    load();
  }, [load]);

  function toggleSort(field: SortField) {
    setSort((s) => ({ field, dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc' }));
    setPage(0);
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="se-crumbs"><Link href="/dashboard">Dashboard</Link> / <span>Venues</span></div>
      <div className="se-head">
        <div>
          <h1 className="se-title">Venues</h1>
          <p className="se-subtitle">Every bar and restaurant connected to Speakeasy, with its POS provider, authentication method and API key coverage.</p>
        </div>
        <div className="se-head-actions">
          <button className="se-btn primary" onClick={() => setEditing('new')}>
            <Plus size={15} /> Connect venue
          </button>
        </div>
      </div>

      {error ? <div className="se-alert error" style={{ marginBottom: 16 }}>{error}</div> : null}

      <section className="se-card">
        <div className="se-toolbar">
          <div className="se-search">
            <Search size={15} />
            <input className="se-input" placeholder="Search venues by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <span className="se-dim" style={{ marginLeft: 'auto' }}>{rows ? `${total} venue${total === 1 ? '' : 's'}` : ''}</span>
        </div>

        {rows === null ? (
          <RowsSkeleton />
        ) : rows.length === 0 ? (
          debounced ? (
            <Empty icon={<Search size={20} />} title="No matches" text={`No venue name contains “${debounced}”.`} action={<button className="se-btn" onClick={() => setSearch('')}>Clear search</button>} />
          ) : (
            <Empty
              icon={<Store size={22} />}
              title="No venues yet"
              text="Connect your first bar or restaurant to start issuing API keys."
              action={<button className="se-btn primary" onClick={() => setEditing('new')}><Plus size={15} /> Connect venue</button>}
            />
          )
        ) : (
          <div className="se-table-wrap">
            <table className="se-table">
              <thead>
                <tr>
                  <th><SortHead field="venueName" sort={sort} onSort={toggleSort}>Venue</SortHead></th>
                  <th>POS provider</th>
                  <th>Auth method</th>
                  <th>API keys</th>
                  <th><SortHead field="createdAt" sort={sort} onSort={toggleSort}>Connected</SortHead></th>
                  <th className="r" style={{ width: 60 }} />
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => {
                  const n = (v.venueApiKeys ?? []).length;
                  return (
                    <tr key={v.id} className="clickable" onClick={() => router.push(`/dashboard/venues/${v.id}`)}>
                      <td>
                        <div className="se-strong">{v.venueName}</div>
                        <div className="se-dim se-mono" style={{ fontSize: 11 }}>{v.id.slice(0, 8)}</div>
                      </td>
                      <td><PosMark provider={v.posProvider} /></td>
                      <td><span className="se-badge neutral">{AUTH_LABELS[v.apiKeyType]}</span></td>
                      <td>
                        {n ? (
                          <span className="se-badge gold"><KeyRound size={11} /> {n} key{n === 1 ? '' : 's'}</span>
                        ) : (
                          <span className="se-badge amber">No keys</span>
                        )}
                      </td>
                      <td className="se-dim">{formatDate(v.createdAt)}</td>
                      <td className="r">
                        <Menu trigger={<button className="se-btn ghost icon" aria-label="Actions"><MoreHorizontal size={16} /></button>}>
                          <button onClick={() => router.push(`/dashboard/venues/${v.id}`)}><KeyRound size={14} /> Manage API keys</button>
                          <button onClick={() => setEditing(v)}><Pencil size={14} /> Edit venue</button>
                          <button className="danger" onClick={() => setDeleting(v)}><Trash2 size={14} /> Delete</button>
                        </Menu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {rows && total > 0 ? (
          <div className="se-pager">
            <span className="se-dim">Showing {from}–{to} of {total}</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="se-btn sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /> Prev</button>
              <span className="se-dim">Page {page + 1} of {pages}</span>
              <button className="se-btn sm" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next <ChevronRight size={14} /></button>
            </div>
          </div>
        ) : null}
      </section>

      {editing ? (
        <VenueFormModal
          venue={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(v) => (editing === 'new' ? router.push(`/dashboard/venues/${v.id}`) : load())}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete venue?"
          message={<>“{deleting.venueName}” will be removed and its integrations will stop being managed here.</>}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteVenue(deleting.id);
            toast('success', 'Venue deleted');
            if (rows?.length === 1 && page > 0) setPage((p) => p - 1);
            else load();
          }}
        />
      ) : null}
    </>
  );
}
