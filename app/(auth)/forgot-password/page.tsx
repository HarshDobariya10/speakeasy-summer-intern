'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!email) { setEmailError('Email is required'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Please enter a valid email address'); return false; }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.cardTop}>
          <span style={s.wordmark}>SPEAKEASY</span>
          <div style={s.divider} />
        </div>

        {submitted ? (
          <div style={s.successState}>
            <div style={s.successIcon}>✉</div>
            <h2 style={s.title}>Check your inbox</h2>
            <p style={s.successText}>
              If <strong style={{ color: '#f0ead6' }}>{email}</strong> is registered, you&apos;ll receive reset instructions shortly.
            </p>
            <div style={s.infoBox}>
              <span style={s.infoIcon}>ℹ</span>
              <span>Check your spam folder if you don&apos;t see the email within a few minutes.</span>
            </div>
            <Link href="/login" style={s.backBtn}>
              <ArrowLeft size={14} />
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <h2 style={s.title}>Reset password</h2>
            <p style={s.subtitle}>Enter your admin email and we&apos;ll send reset instructions.</p>
            <form onSubmit={handleSubmit} noValidate style={s.form}>
              <div style={s.fg}>
                <label htmlFor="fp-email" style={s.label}>Email address</label>
                <input
                  id="fp-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="you@example.com"
                  style={{ ...s.input, ...(emailError ? s.inputErr : {}) }}
                  onFocus={(e) => { e.currentTarget.style.borderBottom = '1.5px solid #c9a84c'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderBottom = emailError ? '1.5px solid #e05252' : '1.5px solid #2a2520'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                {emailError && <span style={s.ferr}>{emailError}</span>}
              </div>
              <button
                id="forgot-submit"
                type="submit"
                disabled={isLoading}
                style={{ ...s.btn, ...(isLoading ? s.btnDisabled : {}) }}
                onMouseEnter={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#e8c97a'; }}
                onMouseLeave={(e) => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#c9a84c'; }}
              >
                {isLoading ? <span style={s.spinRow}><span style={s.spin} />Sending…</span> : 'Send Reset Instructions'}
              </button>
            </form>
            <Link href="/login" style={s.backLink}>
              <ArrowLeft size={13} />
              Back to login
            </Link>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeScale { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0c0b09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'DM Sans',sans-serif" },
  card: { width: '100%', maxWidth: 420, background: '#161410', border: '1px solid #2a2520', borderRadius: 4, padding: '48px 40px', animation: 'fadeIn 0.4s ease' },
  cardTop: { textAlign: 'center', marginBottom: 36 },
  wordmark: { fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, letterSpacing: '0.35em', color: '#f0ead6' },
  divider: { width: 48, height: 1, background: 'linear-gradient(to right,transparent,#c9a84c,transparent)', margin: '20px auto 0' },
  title: { fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 500, color: '#f0ead6', margin: '0 0 10px', letterSpacing: '0.01em' },
  subtitle: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#7a6f5e', margin: '0 0 28px', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  fg: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: '#7a6f5e', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: { background: '#1e1b17', border: 'none', borderBottom: '1.5px solid #2a2520', borderRadius: '2px 2px 0 0', padding: '12px 14px', color: '#f0ead6', fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none', width: '100%', transition: 'border-color 0.2s,box-shadow 0.2s' },
  inputErr: { borderBottom: '1.5px solid #e05252' },
  ferr: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#e05252' },
  btn: { width: '100%', padding: '13px 24px', background: '#c9a84c', color: '#0c0b09', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', border: 'none', borderRadius: 2, cursor: 'pointer', transition: 'background 0.2s,opacity 0.2s' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  spinRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spin: { display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(12,11,9,0.3)', borderTop: '2px solid #0c0b09', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  backLink: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 24, color: '#7a6f5e', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13 },
  successState: { textAlign: 'center', animation: 'fadeScale 0.4s ease' },
  successIcon: { fontSize: 36, marginBottom: 16, color: '#c9a84c' },
  successText: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#7a6f5e', lineHeight: 1.7, margin: '0 0 20px' },
  infoBox: { background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.18)', borderRadius: 4, padding: '12px 14px', color: '#7a6f5e', fontFamily: "'DM Sans',sans-serif", fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.6, textAlign: 'left', marginBottom: 28 },
  infoIcon: { color: '#c9a84c', flexShrink: 0 },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c9a84c', textDecoration: 'none', fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500 },
};
