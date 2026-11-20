'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { AdminRegisterDto } from '@/app/types/auth';

type VErrors = Partial<Record<keyof AdminRegisterDto | 'confirmPassword', string>>;

function strengthOf(pwd: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (!pwd) return { level: 0, label: '' };
  let s = 0;
  if (pwd.length >= 6) s++;
  if (pwd.length >= 10) s++;
  if (/[^a-zA-Z0-9]/.test(pwd)) s++;
  return { level: s as 0 | 1 | 2 | 3, label: ['', 'Weak', 'Fair', 'Strong'][s] };
}
const sColors = ['#2a2520', '#e05252', '#c9a84c', '#4caf87'];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ve, setVe] = useState<VErrors>({});

  const str = strengthOf(password);

  const validate = () => {
    const errors: VErrors = {};
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email';
    if (!password) errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Min. 6 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm password';
    else if (confirmPassword !== password) errors.confirmPassword = 'Passwords do not match';
    setVe(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const dto: AdminRegisterDto = { email, password };
      if (firstName.trim()) dto.firstName = firstName.trim();
      if (lastName.trim()) dto.lastName = lastName.trim();
      if (phone.trim()) dto.phone = phone.trim();
      if (code.trim()) dto.code = code.trim();
      await register(dto);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const inp = (hasErr: boolean): React.CSSProperties => ({ ...s.input, ...(hasErr ? s.inputErr : {}) });
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderBottom = '1.5px solid #c9a84c';
    e.currentTarget.style.boxShadow = '0 4px 12px rgba(201,168,76,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement>, hasErr = false) => {
    e.currentTarget.style.borderBottom = hasErr ? '1.5px solid #e05252' : '1.5px solid #2a2520';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={s.page}>
      <div style={s.brand}>
        <div style={s.brandOverlay} />
        <div style={s.brandContent}>
          <div style={s.brandDecor} />
          <h1 style={s.wordmark}>SPEAKEASY</h1>
          <div style={s.brandDivider} />
          <p style={s.tagline}>Behind the bar,<br />ahead of the game</p>
        </div>
      </div>
      <div style={s.formPanel}>
        <div style={s.formWrap}>
          <h2 style={s.title}>Create account</h2>
          <p style={s.subtitle}>Set up your admin credentials</p>
          <form onSubmit={handleSubmit} noValidate style={s.form}>
            <div style={s.fg}>
              <label htmlFor="r-email" style={s.label}>Email address</label>
              <input id="r-email" type="email" autoComplete="email" value={email}
                onChange={e => { setEmail(e.target.value); setVe(v => ({ ...v, email: undefined })); }}
                placeholder="you@example.com" style={inp(!!ve.email)} onFocus={onFocus} onBlur={e => onBlur(e, !!ve.email)} />
              {ve.email && <span style={s.ferr}>{ve.email}</span>}
            </div>
            <div style={s.fg}>
              <label htmlFor="r-pwd" style={s.label}>Password</label>
              <div style={s.pwdWrap}>
                <input id="r-pwd" type={showPwd ? 'text' : 'password'} autoComplete="new-password" value={password}
                  onChange={e => { setPassword(e.target.value); setVe(v => ({ ...v, password: undefined })); }}
                  placeholder="Min. 6 characters" style={{ ...inp(!!ve.password), paddingRight: '44px' }}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!ve.password)} />
                <button type="button" onClick={() => setShowPwd(x => !x)} style={s.eye} aria-label="Toggle password">
                  {showPwd ? <EyeOff size={16} color="#7a6f5e" /> : <Eye size={16} color="#7a6f5e" />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={s.strRow}>
                  <div style={s.strBar}>
                    {[1, 2, 3].map(i => (
                      <div key={i} style={{ ...s.strSeg, background: i <= str.level ? sColors[str.level] : '#2a2520', transition: 'background 0.3s' }} />
                    ))}
                  </div>
                  <span style={{ ...s.strLbl, color: sColors[str.level] }}>{str.label}</span>
                </div>
              )}
              {ve.password && <span style={s.ferr}>{ve.password}</span>}
            </div>
            <div style={s.fg}>
              <label htmlFor="r-confirm" style={s.label}>Confirm password</label>
              <div style={s.pwdWrap}>
                <input id="r-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setVe(v => ({ ...v, confirmPassword: undefined })); }}
                  placeholder="Repeat password" style={{ ...inp(!!ve.confirmPassword), paddingRight: '44px' }}
                  onFocus={onFocus} onBlur={e => onBlur(e, !!ve.confirmPassword)} />
                <button type="button" onClick={() => setShowConfirm(x => !x)} style={s.eye} aria-label="Toggle confirm">
                  {showConfirm ? <EyeOff size={16} color="#7a6f5e" /> : <Eye size={16} color="#7a6f5e" />}
                </button>
              </div>
              {ve.confirmPassword && <span style={s.ferr}>{ve.confirmPassword}</span>}
            </div>
            <button type="button" onClick={() => setShowOptional(x => !x)} style={s.optToggle}>
              <span>Additional Info</span>
              <span style={s.optBadge}>optional</span>
              {showOptional ? <ChevronUp size={14} color="#7a6f5e" /> : <ChevronDown size={14} color="#7a6f5e" />}
            </button>
            {showOptional && (
              <div style={s.optFields}>
                <div style={s.row}>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label htmlFor="r-fn" style={s.label}>First name</label>
                    <input id="r-fn" type="text" autoComplete="given-name" value={firstName}
                      onChange={e => setFirstName(e.target.value)} placeholder="Jane" style={s.input} onFocus={onFocus} onBlur={e => onBlur(e)} />
                  </div>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label htmlFor="r-ln" style={s.label}>Last name</label>
                    <input id="r-ln" type="text" autoComplete="family-name" value={lastName}
                      onChange={e => setLastName(e.target.value)} placeholder="Doe" style={s.input} onFocus={onFocus} onBlur={e => onBlur(e)} />
                  </div>
                </div>
                <div style={s.row}>
                  <div style={{ ...s.fg, flex: '0 0 90px' }}>
                    <label htmlFor="r-code" style={s.label}>Code</label>
                    <input id="r-code" type="text" value={code}
                      onChange={e => setCode(e.target.value)} placeholder="+1" style={s.input} onFocus={onFocus} onBlur={e => onBlur(e)} />
                  </div>
                  <div style={{ ...s.fg, flex: 1 }}>
                    <label htmlFor="r-phone" style={s.label}>Phone</label>
                    <input id="r-phone" type="tel" autoComplete="tel" value={phone}
                      onChange={e => setPhone(e.target.value)} placeholder="555-0000" style={s.input} onFocus={onFocus} onBlur={e => onBlur(e)} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div style={s.errBox} role="alert">⚠&nbsp; {error}</div>
            )}
            <button id="register-submit" type="submit" disabled={isLoading}
              style={{ ...s.btn, ...(isLoading ? s.btnDisabled : {}) }}
              onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#e8c97a'; }}
              onMouseLeave={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.background = '#c9a84c'; }}>
              {isLoading ? <span style={s.spinRow}><span style={s.spin} />Creating account…</span> : 'Create Account'}
            </button>
          </form>
          <p style={s.switch}>Already have an account? <Link href="/login" style={s.switchLink}>Sign in</Link></p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: { display: 'flex', minHeight: '100vh', background: '#0c0b09', fontFamily: "'DM Sans',sans-serif", animation: 'fadeIn 0.4s ease' },
  brand: { flex: '0 0 60%', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#0c0b09 0%,#1a1610 40%,#0f0d0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandOverlay: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%,rgba(201,168,76,0.10) 0%,transparent 65%)', pointerEvents: 'none' },
  brandContent: { position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 48px' },
  brandDecor: { width: 1, height: 64, background: 'linear-gradient(to bottom,transparent,#c9a84c)', margin: '0 auto 32px' },
  wordmark: { fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(48px,6vw,80px)', fontWeight: 300, letterSpacing: '0.35em', color: '#f0ead6', margin: 0, lineHeight: 1 },
  brandDivider: { width: 64, height: 1, background: 'linear-gradient(to right,transparent,#c9a84c,transparent)', margin: '28px auto' },
  tagline: { fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(18px,2vw,24px)', fontStyle: 'italic', fontWeight: 400, color: '#7a6f5e', lineHeight: 1.6, margin: 0 },
  formPanel: { flex: '0 0 40%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161410', borderLeft: '1px solid #2a2520', padding: '40px 32px', overflowY: 'auto' },
  formWrap: { width: '100%', maxWidth: 360 },
  title: { fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 500, color: '#f0ead6', margin: '0 0 8px', letterSpacing: '0.01em' },
  subtitle: { fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: '#7a6f5e', margin: '0 0 28px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  fg: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, color: '#7a6f5e', letterSpacing: '0.08em', textTransform: 'uppercase' },
  input: { background: '#1e1b17', border: 'none', borderBottom: '1.5px solid #2a2520', borderRadius: '2px 2px 0 0', padding: '11px 14px', color: '#f0ead6', fontFamily: "'DM Sans',sans-serif", fontSize: 14, outline: 'none', width: '100%', transition: 'border-color 0.2s,box-shadow 0.2s' },
  inputErr: { borderBottom: '1.5px solid #e05252' },
  pwdWrap: { position: 'relative' },
  eye: { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  strRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 },
  strBar: { flex: 1, display: 'flex', gap: 4 },
  strSeg: { flex: 1, height: 3, borderRadius: 2 },
  strLbl: { fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0, minWidth: 36 },
  ferr: { fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: '#e05252' },
  optToggle: { display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: '1px solid #2a2520', borderRadius: 2, padding: '9px 14px', cursor: 'pointer', color: '#7a6f5e', fontFamily: "'DM Sans',sans-serif", fontSize: 13, width: '100%', textAlign: 'left', transition: 'border-color 0.2s' },
  optBadge: { fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', background: '#2a2520', color: '#7a6f5e', padding: '2px 6px', borderRadius: 2, marginLeft: 'auto', marginRight: 4 },
  optFields: { display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', background: 'rgba(30,27,23,0.5)', border: '1px solid #2a2520', borderTop: 'none', borderRadius: '0 0 2px 2px' },
  row: { display: 'flex', gap: 10 },
  errBox: { background: 'rgba(224,82,82,0.08)', border: '1px solid rgba(224,82,82,0.25)', borderRadius: 4, padding: '11px 14px', color: '#e05252', fontFamily: "'DM Sans',sans-serif", fontSize: 13, lineHeight: 1.5 },
  btn: { width: '100%', padding: '13px 24px', background: '#c9a84c', color: '#0c0b09', fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', borderRadius: 2, cursor: 'pointer', transition: 'background 0.2s,opacity 0.2s', marginTop: 4 },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  spinRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
  spin: { display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(12,11,9,0.3)', borderTop: '2px solid #0c0b09', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  switch: { marginTop: 26, textAlign: 'center', fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#7a6f5e' },
  switchLink: { color: '#c9a84c', textDecoration: 'none', fontWeight: 500 },
};
