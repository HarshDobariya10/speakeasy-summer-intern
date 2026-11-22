'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { KeyRound, LayoutDashboard, LogOut, Menu as MenuIcon, Store, UserRound, X, BookOpen } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { ToastProvider, Skeleton } from './_components/ui';
import './dashboard.css';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard', exact: true },
  { icon: Store, label: 'Venues', href: '/dashboard/venues' },
  { icon: KeyRound, label: 'API Keys', href: '/dashboard/api-keys' },
  { icon: UserRound, label: 'My Account', href: '/dashboard/profile' },
];

function LoadingShell() {
  return (
    <div className="se">
      <div className="se-accent" />
      <div className="se-shell">
        <aside className="se-sidebar">
          <div className="se-brand"><Skeleton w={150} h={22} /></div>
          <div className="se-divider" />
          <div style={{ padding: '0 24px', display: 'grid', gap: 18 }}>
            {[80, 65, 70, 75].map((w) => <Skeleton key={w} w={`${w}%`} />)}
          </div>
        </aside>
        <main className="se-main">
          <Skeleton w={260} h={34} style={{ marginBottom: 28 }} />
          <div className="se-grid stats">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} h={130} style={{ borderRadius: 10 }} />)}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <LoadingShell />;
  if (!isAuthenticated) return null;

  const displayName = user?.firstNameLastName || user?.email?.split('@')[0] || 'Admin';
  const initials = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  return (
    <ToastProvider>
      <div className="se">
        <div className="se-accent" />

        <div className="se-mobilebar">
          <span className="se-brand-name" style={{ fontSize: 18 }}>SPEAKEASY</span>
          <button className="se-btn ghost icon" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <MenuIcon size={20} />
          </button>
        </div>

        <div className="se-shell">
          <aside className={`se-sidebar ${menuOpen ? 'open' : ''}`}>
            <div className="se-brand" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="se-brand-name">SPEAKEASY</div>
                <div className="se-brand-sub">POS Integration Hub</div>
              </div>
              {menuOpen ? (
                <button className="se-btn ghost icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <X size={18} />
                </button>
              ) : null}
            </div>
            <div className="se-divider" />

            <nav className="se-nav">
              <div className="se-nav-label">Manage</div>
              {NAV.map(({ icon: Icon, label, href, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link key={href} href={href} className={`se-nav-item ${active ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                    <Icon size={17} strokeWidth={1.75} />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <div className="se-nav-label" style={{ marginTop: 22 }}>Developer</div>
              <a className="se-nav-item" href={`${API_URL}/api`} target="_blank" rel="noreferrer">
                <BookOpen size={17} strokeWidth={1.75} />
                <span>API Docs</span>
                <span className="se-nav-count">Swagger</span>
              </a>
            </nav>

            <div>
              <div className="se-divider" style={{ marginTop: 0 }} />
              <Link href="/dashboard/profile" className="se-user">
                <div className="se-avatar">{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div className="se-user-name">{displayName}</div>
                  <div className="se-user-mail">{user?.email}</div>
                </div>
              </Link>
              <div style={{ padding: '0 12px' }}>
                <button className="se-btn ghost" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={logout}>
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            </div>
          </aside>

          <main className="se-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
