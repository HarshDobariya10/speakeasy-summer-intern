'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { logout } from '@/app/lib/authService';
import { LayoutDashboard, Settings, Users, ShoppingBag, LogOut, MapPin } from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Orders', href: '/dashboard/orders' },
  { icon: Users, label: 'Staff', href: '/dashboard/staff' },
  { icon: MapPin, label: 'Venues', href: '/dashboard/venues' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

function SkeletonLoader() {
  return (
    <div style={s.skPage}>
      <div style={s.skTopBar}>
        <div style={{ ...s.skPulse, width: 120, height: 18, borderRadius: 2 }} />
      </div>
      <div style={s.skBody}>
        <div style={s.skSidebar}>
          <div style={{ ...s.skPulse, width: '70%', height: 20, borderRadius: 2, marginBottom: 32 }} />
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ ...s.skPulse, width: '85%', height: 14, borderRadius: 2, marginBottom: 18 }} />
          ))}
        </div>
        <div style={s.skMain}>
          <div style={{ ...s.skPulse, width: '40%', height: 28, borderRadius: 2, marginBottom: 24 }} />
          <div style={s.skGrid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ ...s.skPulse, height: 100, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) return <SkeletonLoader />;
  if (!isAuthenticated) return null;

  const displayName = user?.firstNameLastName || user?.email || 'Admin';
  const initials = (user?.firstName?.[0] ?? user?.email?.[0] ?? 'A').toUpperCase();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div style={s.layout}>
      {/* Gold top bar accent */}
      <div style={s.topAccent} />

      <div style={s.body}>
        {/* Sidebar */}
        <aside style={s.sidebar}>
          <div style={s.sidebarInner}>
            <div style={s.logoWrap}>
              <span style={s.logoText}>SPEAKEASY</span>
              <span style={s.logoSub}>POS Admin</span>
            </div>
            <div style={s.navDivider} />
            <nav style={s.nav}>
              {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                <Link key={href} href={href} style={s.navItem}>
                  <Icon size={16} color="#7a6f5e" />
                  <span style={s.navLabel}>{label}</span>
                </Link>
              ))}
            </nav>
            <div style={s.sidebarBottom}>
              <div style={s.navDivider} />
              <div style={s.adminRow}>
                <div style={s.avatar}>{initials}</div>
                <div style={s.adminInfo}>
                  <span style={s.adminName}>{displayName}</span>
                  <span style={s.adminEmail}>{user?.email}</span>
                </div>
              </div>
              <button
                id="sidebar-logout"
                onClick={handleLogout}
                style={s.logoutBtn}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#e05252'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(224,82,82,0.2)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#7a6f5e'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2520'; }}
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={s.main}>
          {children}
        </main>
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  layout: { minHeight: '100vh', background: '#0c0b09', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans',sans-serif" },
  topAccent: { height: 2, background: 'linear-gradient(to right,transparent,#c9a84c 30%,#e8c97a 50%,#c9a84c 70%,transparent)', flexShrink: 0 },
  body: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: 240, flexShrink: 0, background: '#161410', borderRight: '1px solid #2a2520', display: 'flex', flexDirection: 'column' },
  sidebarInner: { display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 0' },
  logoWrap: { padding: '0 20px 0', display: 'flex', flexDirection: 'column', gap: 3 },
  logoText: { fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, letterSpacing: '0.3em', color: '#f0ead6' },
  logoSub: { fontSize: 10, letterSpacing: '0.15em', color: '#3d3630', textTransform: 'uppercase' },
  navDivider: { height: 1, background: '#2a2520', margin: '20px 0' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 4, color: '#7a6f5e', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, transition: 'background 0.15s,color 0.15s' },
  navLabel: { color: '#7a6f5e', fontSize: 13 },
  sidebarBottom: { padding: '0 12px' },
  adminRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 16px' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#c9a84c,#e8c97a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#0c0b09', flexShrink: 0 },
  adminInfo: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  adminName: { fontSize: 13, fontWeight: 500, color: '#f0ead6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  adminEmail: { fontSize: 11, color: '#7a6f5e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px', background: 'transparent', border: '1px solid #2a2520', borderRadius: 4, cursor: 'pointer', color: '#7a6f5e', fontFamily: "'DM Sans',sans-serif", fontSize: 13, transition: 'color 0.2s,border-color 0.2s' },
  main: { flex: 1, overflow: 'auto', padding: '40px 48px', background: '#0c0b09' },
  // Skeleton styles
  skPage: { minHeight: '100vh', background: '#0c0b09', display: 'flex', flexDirection: 'column' },
  skTopBar: { height: 48, background: '#161410', borderBottom: '1px solid #2a2520', display: 'flex', alignItems: 'center', padding: '0 24px' },
  skBody: { display: 'flex', flex: 1 },
  skSidebar: { width: 240, background: '#161410', borderRight: '1px solid #2a2520', padding: '32px 24px' },
  skMain: { flex: 1, padding: '40px 48px' },
  skGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 },
  skPulse: { background: '#2a2520', animation: 'pulse 1.5s ease-in-out infinite' },
};
