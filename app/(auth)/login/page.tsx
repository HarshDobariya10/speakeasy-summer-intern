'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({ email, password });
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Left brand panel */}
      <div style={styles.brandPanel}>
        <div style={styles.brandOverlay} />
        <div style={styles.brandContent}>
          <div style={styles.brandDecor} />
          <h1 style={styles.wordmark}>SPEAKEASY</h1>
          <div style={styles.brandDivider} />
          <p style={styles.tagline}>Behind the bar,<br />ahead of the game</p>
          <div style={styles.brandFooter}>
            <span style={styles.brandFooterText}>EST. 2024 · POS ADMINISTRATION</span>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={styles.formPanel}>
        <div style={styles.formContainer}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} noValidate style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label htmlFor="login-email" style={styles.label}>Email address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setValidationErrors(v => ({ ...v, email: undefined })); }}
                placeholder="you@example.com"
                style={{
                  ...styles.input,
                  ...(validationErrors.email ? styles.inputError : {}),
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottom = '1.5px solid #c9a84c';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 168, 76, 0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderBottom = validationErrors.email ? '1.5px solid #e05252' : '1.5px solid #2a2520';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              {validationErrors.email && (
                <span style={styles.fieldError}>{validationErrors.email}</span>
              )}
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label htmlFor="login-password" style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setValidationErrors(v => ({ ...v, password: undefined })); }}
                  placeholder="Min. 6 characters"
                  style={{
                    ...styles.input,
                    paddingRight: '44px',
                    ...(validationErrors.password ? styles.inputError : {}),
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottom = '1.5px solid #c9a84c';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(201, 168, 76, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottom = validationErrors.password ? '1.5px solid #e05252' : '1.5px solid #2a2520';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={styles.eyeButton}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} color="#7a6f5e" /> : <Eye size={16} color="#7a6f5e" />}
                </button>
              </div>
              {validationErrors.password && (
                <span style={styles.fieldError}>{validationErrors.password}</span>
              )}
            </div>

            {/* Forgot password */}
            <div style={styles.forgotRow}>
              <Link href="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
            </div>

            {/* API error */}
            {error && (
              <div style={styles.errorBox} role="alert">
                <span style={styles.errorIcon}>⚠</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              style={{ ...styles.submitButton, ...(isLoading ? styles.submitButtonDisabled : {}) }}
              onMouseEnter={(e) => {
                if (!isLoading) e.currentTarget.style.background = '#e8c97a';
              }}
              onMouseLeave={(e) => {
                if (!isLoading) e.currentTarget.style.background = '#c9a84c';
              }}
            >
              {isLoading ? (
                <span style={styles.spinnerWrapper}>
                  <span style={styles.spinner} />
                  Signing in…
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p style={styles.switchText}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={styles.switchLink}>Register</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    background: '#0c0b09',
    fontFamily: "'DM Sans', sans-serif",
    animation: 'fadeIn 0.4s ease',
  },
  brandPanel: {
    flex: '0 0 60%',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0c0b09 0%, #1a1610 40%, #0f0d0a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.10) 0%, transparent 65%)',
    pointerEvents: 'none',
  },
  brandContent: {
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    padding: '0 48px',
  },
  brandDecor: {
    width: 1,
    height: 64,
    background: 'linear-gradient(to bottom, transparent, #c9a84c)',
    margin: '0 auto 32px',
  },
  wordmark: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(48px, 6vw, 80px)',
    fontWeight: 300,
    letterSpacing: '0.35em',
    color: '#f0ead6',
    margin: 0,
    lineHeight: 1,
  },
  brandDivider: {
    width: 64,
    height: 1,
    background: 'linear-gradient(to right, transparent, #c9a84c, transparent)',
    margin: '28px auto',
  },
  tagline: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 'clamp(18px, 2vw, 24px)',
    fontStyle: 'italic',
    fontWeight: 400,
    color: '#7a6f5e',
    lineHeight: 1.6,
    margin: 0,
    letterSpacing: '0.02em',
  },
  brandFooter: {
    marginTop: 56,
  },
  brandFooterText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    letterSpacing: '0.2em',
    color: '#3d3630',
    textTransform: 'uppercase' as const,
  },
  formPanel: {
    flex: '0 0 40%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#161410',
    borderLeft: '1px solid #2a2520',
    padding: '48px 32px',
  },
  formContainer: {
    width: '100%',
    maxWidth: 360,
  },
  formHeader: {
    marginBottom: 36,
  },
  formTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 32,
    fontWeight: 500,
    color: '#f0ead6',
    margin: '0 0 8px',
    letterSpacing: '0.01em',
  },
  formSubtitle: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    color: '#7a6f5e',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  label: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: '#7a6f5e',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  input: {
    background: '#1e1b17',
    border: 'none',
    borderBottom: '1.5px solid #2a2520',
    borderRadius: '2px 2px 0 0',
    padding: '12px 14px',
    color: '#f0ead6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  inputError: {
    borderBottom: '1.5px solid #e05252',
  },
  passwordWrapper: {
    position: 'relative' as const,
  },
  eyeButton: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  fieldError: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#e05252',
    marginTop: 2,
  },
  forgotRow: {
    textAlign: 'right' as const,
    marginTop: -8,
  },
  forgotLink: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#7a6f5e',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  errorBox: {
    background: 'rgba(224, 82, 82, 0.08)',
    border: '1px solid rgba(224, 82, 82, 0.25)',
    borderRadius: 4,
    padding: '12px 16px',
    color: '#e05252',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    lineHeight: 1.5,
  },
  errorIcon: {
    flexShrink: 0,
    marginTop: 1,
  },
  submitButton: {
    width: '100%',
    padding: '14px 24px',
    background: '#c9a84c',
    color: '#0c0b09',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    transition: 'background 0.2s, opacity 0.2s',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  spinnerWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  spinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    border: '2px solid rgba(12,11,9,0.3)',
    borderTop: '2px solid #0c0b09',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  switchText: {
    marginTop: 28,
    textAlign: 'center' as const,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#7a6f5e',
  },
  switchLink: {
    color: '#c9a84c',
    textDecoration: 'none',
    fontWeight: 500,
  },
};
