'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, KeyRound, Plus, RefreshCw, ShieldAlert, Store, Plug } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getProfile } from '@/app/lib/authService';
import {
  API_KEY_TYPES,
  AUTH_LABELS,
  POS_LABELS,
  POS_PROVIDERS,
  keyStatus,
  listAllVenuesWithKeys,
  timeAgo,
  timeUntil,
  type Venue,
} from '@/app/lib/speakeasy';
import { Empty, KeyStatusBadge, PosMark, Skeleton } from './_components/ui';
import { VenueFormModal } from './_components/forms';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

type Health = { api: number | null; db: number | null; ok: boolean | null };

/** Loads all venues and times the two round-trips for the health panel. */
async function fetchOverview() {
  const t0 = performance.now();
  await getProfile();
  const t1 = performance.now();
  const data = await listAllVenuesWithKeys();
  const t2 = performance.now();
  return { data, api: Math.round(t1 - t0), db: Math.round(t2 - t1) };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health>({ api: null, db: null, ok: null });
  const [creating, setCreating] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const load = useCallback(
    () =>
      fetchOverview().then(
        ({ data, api, db }) => {
          setVenues(data);
          setError(null);
          setHealth({ api, db, ok: true });
          setRefreshedAt(new Date());
        },
        (e: Error) => {
          setError(e.message);
          setHealth({ api: null, db: null, ok: false });
          setVenues((v) => v ?? []);
        },
      ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const keys = (venues ?? []).flatMap((v) => (v.venueApiKeys ?? []).map((k) => ({ ...k, venue: v })));
    const byStatus = { active: 0, expiring: 0, expired: 0 };
    keys.forEach((k) => byStatus[keyStatus(k)]++);
    const byPos = Object.fromEntries(POS_PROVIDERS.map((p) => [p, 0])) as Record<string, number>;
    const byAuth = Object.fromEntries(API_KEY_TYPES.map((p) => [p, 0])) as Record<string, number>;
    (venues ?? []).forEach((v) => {
      byPos[v.posProvider]++;
      byAuth[v.apiKeyType]++;
    });
    const attention = keys
      .filter((k) => keyStatus(k) !== 'active')
      .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
      .slice(0, 5);
    const noKeys = (venues ?? []).filter((v) => !(v.venueApiKeys ?? []).length).length;
    const providers = POS_PROVIDERS.filter((p) => byPos[p] > 0).length;
    return { keys, byStatus, byPos, byAuth, attention, noKeys, providers };
  }, [venues]);

  const loading = venues === null;
  const name = user?.firstName || user?.email?.split('@')[0] || 'there';

  return (
    <>
      <section className="se-card se-hero">
        <div className="se-hero-eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1>
          {greeting()}, <em>{name}</em>
        </h1>
        <p>
          Speakeasy connects bars and restaurants to their point-of-sale systems. Register a venue, store its POS
          credentials, and issue secure API keys for its integrations, all from one place.
        </p>
        <div className="se-hero-actions">
          <button className="se-btn primary" onClick={() => setCreating(true)}>
            <Plus size={15} /> Connect venue
          </button>
          <Link className="se-btn" href="/dashboard/venues">
            View all venues <ArrowRight size={14} />
          </Link>
          <button className="se-btn ghost" onClick={load} title="Refresh">
            <RefreshCw size={14} /> {refreshedAt ? `Updated ${timeAgo(refreshedAt.toISOString())}` : 'Refresh'}
          </button>
        </div>
      </section>

      {error ? <div className="se-alert error" style={{ marginBottom: 18 }}>Couldn’t load data: {error}</div> : null}

      <div className="se-grid stats" style={{ marginBottom: 18 }}>
        <StatCard
          loading={loading}
          icon={<Store size={16} />}
          label="Venues"
          value={venues?.length ?? 0}
          foot={<><b>{stats.providers}</b> of {POS_PROVIDERS.length} POS providers in use</>}
        />
        <StatCard
          loading={loading}
          icon={<KeyRound size={16} />}
          label="API keys"
          value={stats.keys.length}
          foot={<><b>{stats.byStatus.active}</b> active · <b>{stats.byStatus.expired}</b> expired</>}
        />
        <StatCard
          loading={loading}
          icon={<Clock size={16} />}
          label="Expiring soon"
          value={stats.byStatus.expiring}
          foot={<>Keys expiring within <b>3 days</b></>}
          tone={stats.byStatus.expiring ? 'amber' : undefined}
        />
        <StatCard
          loading={loading}
          icon={<ShieldAlert size={16} />}
          label="Need setup"
          value={stats.noKeys}
          foot={<>Venues with <b>no API key</b> yet</>}
          tone={stats.noKeys ? 'amber' : undefined}
        />
      </div>

      {!loading && venues!.length === 0 ? (
        <section className="se-card" style={{ marginBottom: 18 }}>
          <Empty
            icon={<Plug size={22} />}
            title="Connect your first venue"
            text="Add a bar or restaurant, choose its POS provider and auth method, then issue it an API key."
            action={<button className="se-btn primary" onClick={() => setCreating(true)}><Plus size={15} /> Connect venue</button>}
          />
        </section>
      ) : null}

      <div className="se-grid two" style={{ marginBottom: 18 }}>
        <section className="se-card">
          <div className="se-card-head">
            <div>
              <h2 className="se-card-title">Recently connected</h2>
              <div className="se-card-sub">Newest venues and their key coverage</div>
            </div>
            <Link className="se-btn sm" href="/dashboard/venues">All venues</Link>
          </div>
          <div className="se-list">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div className="se-list-item" key={i}><Skeleton w={28} h={28} /><Skeleton w="45%" /></div>
                ))
              : venues!.slice(0, 6).map((v) => (
                  <Link className="se-list-item" key={v.id} href={`/dashboard/venues/${v.id}`}>
                    <PosMark provider={v.posProvider} withLabel={false} />
                    <div className="se-list-main">
                      <div className="se-list-title">{v.venueName}</div>
                      <div className="se-dim">{POS_LABELS[v.posProvider]} · {AUTH_LABELS[v.apiKeyType]}</div>
                    </div>
                    <span className={`se-badge ${(v.venueApiKeys ?? []).length ? 'neutral' : 'amber'}`}>
                      <KeyRound size={11} /> {(v.venueApiKeys ?? []).length}
                    </span>
                    <span className="se-dim" style={{ width: 64, textAlign: 'right' }}>{timeAgo(v.createdAt)}</span>
                  </Link>
                ))}
            {!loading && venues!.length === 0 ? <div className="se-empty" style={{ padding: 32 }}>No venues yet.</div> : null}
          </div>
        </section>

        <section className="se-card">
          <div className="se-card-head">
            <div>
              <h2 className="se-card-title">Needs attention</h2>
              <div className="se-card-sub">Expired or soon-to-expire API keys</div>
            </div>
            <Link className="se-btn sm" href="/dashboard/api-keys">All keys</Link>
          </div>
          <div className="se-list">
            {loading ? (
              <div className="se-list-item"><Skeleton w="60%" /></div>
            ) : stats.attention.length === 0 ? (
              <div className="se-empty" style={{ padding: '40px 24px' }}>
                <div className="se-empty-icon" style={{ color: 'var(--green)' }}><KeyRound size={20} /></div>
                <p style={{ margin: 0 }}>All keys are healthy. Nothing is expiring in the next 3 days.</p>
              </div>
            ) : (
              stats.attention.map((k) => (
                <Link className="se-list-item" key={k.id} href={`/dashboard/venues/${k.venueId}`}>
                  <div className="se-list-main">
                    <div className="se-list-title">{k.name}</div>
                    <div className="se-dim">{k.venue.venueName} · {timeUntil(k.expiresAt)}</div>
                  </div>
                  <KeyStatusBadge k={k} />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="se-grid three" style={{ marginBottom: 18 }}>
        <section className="se-card se-card-pad">
          <h2 className="se-card-title" style={{ marginBottom: 4 }}>POS providers</h2>
          <div className="se-card-sub" style={{ marginBottom: 20 }}>Venues per point-of-sale system</div>
          <Bars loading={loading} rows={POS_PROVIDERS.map((p) => ({ label: POS_LABELS[p], value: stats.byPos[p] }))} />
        </section>
        <section className="se-card se-card-pad">
          <h2 className="se-card-title" style={{ marginBottom: 4 }}>Auth methods</h2>
          <div className="se-card-sub" style={{ marginBottom: 20 }}>How venues authenticate to their POS</div>
          <Bars
            loading={loading}
            rows={API_KEY_TYPES.map((t) => ({ label: AUTH_LABELS[t].replace('OAuth2 · ', 'OAuth2 '), value: stats.byAuth[t] }))
              .filter((r) => r.value > 0 || (venues ?? []).length === 0)
              .sort((a, b) => b.value - a.value)}
          />
        </section>
        <section className="se-card se-card-pad">
          <h2 className="se-card-title" style={{ marginBottom: 4 }}>System health</h2>
          <div className="se-card-sub" style={{ marginBottom: 8 }}>Live checks from this browser</div>
          <HealthRow label="Backend API" detail={API_URL.replace(/^https?:\/\//, '')} ms={health.api} ok={health.ok} />
          <HealthRow label="Database (MySQL)" detail="via Prisma" ms={health.db} ok={health.ok} />
          <HealthRow label="Admin session" detail="JWT access token" ms={null} ok={health.ok} text={health.ok ? 'Valid' : undefined} />
        </section>
      </div>

      <section className="se-card">
        <div className="se-card-head">
          <div>
            <h2 className="se-card-title">How Speakeasy works</h2>
            <div className="se-card-sub">The integration lifecycle this admin panel manages</div>
          </div>
        </div>
        <div className="se-flow">
          {[
            ['Connect venue', 'Register the bar or restaurant and pick its POS provider: Oracle, Toast or Union.'],
            ['Store credentials', 'Save how to reach the POS: API key, OAuth2, JWT, Basic auth or custom headers.'],
            ['Issue API keys', 'Generate spk_ keys with 1-day, 1-week, 1-month or no expiry for the venue’s apps.'],
            ['Monitor & rotate', 'Track expiring keys, edit validity, and revoke anything compromised.'],
          ].map(([t, d], i) => (
            <div className="se-flow-step" key={t}>
              <div className="se-flow-n">0{i + 1}</div>
              <div className="se-flow-t">{t}</div>
              <div className="se-flow-d">{d}</div>
            </div>
          ))}
        </div>
      </section>

      {creating ? <VenueFormModal onClose={() => setCreating(false)} onSaved={() => load()} /> : null}
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  foot,
  loading,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  foot: React.ReactNode;
  loading: boolean;
  tone?: 'amber';
}) {
  return (
    <div className="se-card se-stat">
      <div className="se-stat-top">
        <span className="se-stat-label">{label}</span>
        <span className="se-stat-icon" style={tone ? { background: 'var(--amber-soft)', color: 'var(--amber)' } : undefined}>{icon}</span>
      </div>
      {loading ? <Skeleton w={60} h={42} style={{ margin: '16px 0 8px' }} /> : <div className="se-stat-value">{value}</div>}
      <div className="se-stat-foot">{foot}</div>
    </div>
  );
}

function Bars({ rows, loading }: { rows: { label: string; value: number }[]; loading: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="se-bars">
      {rows.map((r) => (
        <div className="se-bar-row" key={r.label} style={{ gridTemplateColumns: '120px 1fr 28px' }}>
          <span style={{ color: 'var(--text-2)', fontSize: 12.5 }}>{r.label}</span>
          <div className="se-bar-track">
            <div className="se-bar-fill" style={{ width: loading ? '0%' : `${(r.value / max) * 100}%` }} />
          </div>
          <span className="se-bar-val">{loading ? '–' : r.value}</span>
        </div>
      ))}
    </div>
  );
}

function HealthRow({ label, detail, ms, ok, text }: { label: string; detail: string; ms: number | null; ok: boolean | null; text?: string }) {
  return (
    <div className="se-health">
      <span className={`se-pulse ${ok === null ? 'wait' : ok ? 'ok' : 'bad'}`} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div className="se-dim se-mono" style={{ fontSize: 11 }}>{detail}</div>
      </div>
      <span className="se-dim" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {ok === null ? 'Checking…' : !ok ? 'Unreachable' : text ?? `${ms} ms`}
      </span>
    </div>
  );
}
