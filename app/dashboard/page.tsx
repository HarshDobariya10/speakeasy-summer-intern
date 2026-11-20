'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const greeting = user?.firstName ? `Welcome back, ${user.firstName}` : 'Welcome back';

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.heading}>{greeting}</h1>
        <p style={s.subheading}>Here&apos;s an overview of your POS system</p>
      </div>

      <div style={s.statsGrid}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} style={s.statCard}>
            <div style={s.statTop}>
              <span style={s.statLabel}>{card.label}</span>
              <span style={s.statBadge}>{card.change}</span>
            </div>
            <div style={s.statValue}>{card.value}</div>
            <div style={s.statBar}>
              <div style={{ ...s.statBarFill, width: card.fill }} />
            </div>
          </div>
        ))}
      </div>

      <div style={s.section}>
        <h2 style={s.sectionTitle}>System Status</h2>
        <div style={s.statusList}>
          {STATUS_ITEMS.map((item) => (
            <div key={item.label} style={s.statusRow}>
              <div style={statusDot(item.ok)} />
              <span style={s.statusLabel}>{item.label}</span>
              <span style={s.statusValue}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const STAT_CARDS = [
  { label: "Today's Revenue", value: '—', change: '+0%', fill: '0%' },
  { label: 'Orders Today', value: '—', change: '0 new', fill: '0%' },
  { label: 'Active Staff', value: '—', change: 'on shift', fill: '0%' },
  { label: 'Avg. Order Value', value: '—', change: 'vs yesterday', fill: '0%' },
];

const STATUS_ITEMS = [
  { label: 'API Connection', value: 'http://localhost:3000', ok: true },
  { label: 'Authentication', value: 'Active', ok: true },
  { label: 'Database', value: 'Connected', ok: true },
];

const statusDot = (ok: boolean): React.CSSProperties => ({
  width: 8, height: 8, borderRadius: '50%',
  background: ok ? '#4caf87' : '#e05252',
  flexShrink: 0,
  boxShadow: ok ? '0 0 6px rgba(76,175,135,0.4)' : '0 0 6px rgba(224,82,82,0.4)',
});

const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'DM Sans',sans-serif", color: '#f0ead6' },
  header: { marginBottom: 40 },
  heading: { fontFamily: "'Cormorant Garamond',serif", fontSize: 36, fontWeight: 500, color: '#f0ead6', margin: '0 0 8px', letterSpacing: '0.01em' },
  subheading: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#7a6f5e', margin: 0 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20, marginBottom: 48 },
  statCard: { background: '#161410', border: '1px solid #2a2520', borderRadius: 4, padding: '24px', transition: 'border-color 0.2s' },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statLabel: { fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a6f5e' },
  statBadge: { fontSize: 11, color: '#c9a84c', background: 'rgba(201,168,76,0.08)', padding: '2px 7px', borderRadius: 10 },
  statValue: { fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, color: '#f0ead6', marginBottom: 16 },
  statBar: { height: 2, background: '#2a2520', borderRadius: 1 },
  statBarFill: { height: '100%', background: 'linear-gradient(to right,#c9a84c,#e8c97a)', borderRadius: 1 },
  section: { background: '#161410', border: '1px solid #2a2520', borderRadius: 4, padding: '28px' },
  sectionTitle: { fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 500, color: '#f0ead6', margin: '0 0 20px', letterSpacing: '0.01em' },
  statusList: { display: 'flex', flexDirection: 'column', gap: 14 },
  statusRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #1e1b17' },
  statusLabel: { fontSize: 13, color: '#f0ead6', flex: 1 },
  statusValue: { fontSize: 12, color: '#7a6f5e', fontFamily: "'DM Sans',sans-serif" },
};
