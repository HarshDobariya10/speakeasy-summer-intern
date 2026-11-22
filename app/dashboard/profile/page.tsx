'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LogOut, Monitor, RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { getAccessToken, getRefreshToken } from '@/app/lib/token';
import { refreshToken as refreshTokens } from '@/app/lib/authService';
import { formatDate, timeAgo } from '@/app/lib/speakeasy';
import { useToast } from '../_components/ui';

type Claims = { exp?: number; iat?: number; type?: string; userType?: string };

function decodeJwt(token: string | null): Claims | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

function countdown(secLeft: number) {
  if (secLeft <= 0) return 'expired';
  const d = Math.floor(secLeft / 86400);
  const h = Math.floor((secLeft % 86400) / 3600);
  const m = Math.floor((secLeft % 3600) / 60);
  const s = secLeft % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function TokenRow({ label, claims, now }: { label: string; claims: Claims | null; now: number }) {
  const left = claims?.exp ? Math.floor(claims.exp - now / 1000) : 0;
  const life = claims?.exp && claims?.iat ? claims.exp - claims.iat : 1;
  const pct = Math.max(0, Math.min(100, (left / life) * 100));
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span className={`se-badge ${left > 0 ? 'green' : 'red'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="dot" />{claims ? countdown(left) : 'missing'}
        </span>
      </div>
      <div className="se-bar-track" style={{ height: 5 }}>
        <div className="se-bar-fill" style={{ width: `${pct}%`, transition: 'width 1s linear' }} />
      </div>
      <div className="se-dim" style={{ marginTop: 6 }}>
        Issued {claims?.iat ? formatDate(new Date(claims.iat * 1000).toISOString(), true) : '—'} · expires{' '}
        {claims?.exp ? formatDate(new Date(claims.exp * 1000).toISOString(), true) : '—'}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const now = useNow();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const access = useMemo(() => decodeJwt(getAccessToken()), [tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refresh = useMemo(() => decodeJwt(getRefreshToken()), [tick]);

  if (!user) return null;

  const name = user.firstNameLastName || user.email.split('@')[0];
  const initials = (user.firstName?.[0] ?? user.email[0]).toUpperCase() + (user.lastName?.[0]?.toUpperCase() ?? '');
  const browser = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const browserName = /Edg\//.test(browser) ? 'Microsoft Edge' : /Chrome\//.test(browser) ? 'Google Chrome' : /Safari\//.test(browser) ? 'Safari' : /Firefox\//.test(browser) ? 'Firefox' : 'Browser';
  const os = /Mac OS X/.test(browser) ? 'macOS' : /Windows/.test(browser) ? 'Windows' : /Android/.test(browser) ? 'Android' : /iPhone|iPad/.test(browser) ? 'iOS' : /Linux/.test(browser) ? 'Linux' : '';

  return (
    <>
      <div className="se-crumbs"><Link href="/dashboard">Dashboard</Link> / <span>My account</span></div>
      <div className="se-head">
        <div>
          <h1 className="se-title">My account</h1>
          <p className="se-subtitle">Your administrator profile and the security of this signed-in session.</p>
        </div>
      </div>

      <div className="se-grid two">
        <section className="se-card">
          <div className="se-card-pad" style={{ display: 'flex', gap: 18, alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
            <div className="se-avatar lg">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 28, lineHeight: 1.1 }}>{name}</div>
              <div className="se-dim" style={{ fontSize: 13, marginTop: 4 }}>{user.email}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <span className="se-badge gold">Administrator</span>
                <span className={`se-badge ${user.status === 'ENABLED' ? 'green' : 'amber'}`}><span className="dot" />{user.status.toLowerCase()}</span>
              </div>
            </div>
          </div>
          <div className="se-card-pad" style={{ paddingTop: 6, paddingBottom: 6 }}>
            <div className="se-kv">
              <div className="k">First name</div><div className="v">{user.firstName || '—'}</div>
              <div className="k">Last name</div><div className="v">{user.lastName || '—'}</div>
              <div className="k">Email</div><div className="v">{user.email}</div>
              <div className="k">Phone</div><div className="v">{user.phone ? `${user.code ?? ''} ${user.phone}`.trim() : '—'}</div>
              <div className="k">Admin ID</div><div className="v se-mono">{user.id}</div>
              <div className="k">Last sign-in</div><div className="v">{user.lastLogin ? `${formatDate(user.lastLogin, true)} (${timeAgo(user.lastLogin)})` : 'This is your first session'}</div>
            </div>
          </div>
        </section>

        <div className="se-grid" style={{ alignSelf: 'start' }}>
          <section className="se-card">
            <div className="se-card-head">
              <div>
                <h2 className="se-card-title">Session security</h2>
                <div className="se-card-sub">JWT access + refresh token pair, rotated on refresh</div>
              </div>
              <ShieldCheck size={18} color="var(--gold)" />
            </div>
            <div className="se-card-pad" style={{ paddingTop: 0 }}>
              <TokenRow label="Access token" claims={access} now={now} />
              <TokenRow label="Refresh token" claims={refresh} now={now} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  className="se-btn"
                  disabled={busy}
                  onClick={async () => {
                    const rt = getRefreshToken();
                    if (!rt) return;
                    setBusy(true);
                    try {
                      await refreshTokens({ refreshToken: rt });
                      setTick((t) => t + 1);
                      toast('success', 'Tokens rotated: new access & refresh issued');
                    } catch (e) {
                      toast('error', (e as Error).message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <RefreshCw size={14} /> {busy ? 'Rotating…' : 'Rotate tokens'}
                </button>
                <button className="se-btn danger" onClick={logout}><LogOut size={14} /> Sign out</button>
              </div>
            </div>
          </section>

          <section className="se-card">
            <div className="se-card-head"><h2 className="se-card-title">This device</h2></div>
            <div className="se-list-item" style={{ borderBottom: 'none' }}>
              <span className="se-stat-icon"><Monitor size={16} /></span>
              <div className="se-list-main">
                <div className="se-list-title">{browserName}{os ? ` on ${os}` : ''}</div>
                <div className="se-dim">Current session · signing out ends it on the server</div>
              </div>
              <span className="se-badge green"><span className="dot" />Active</span>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
