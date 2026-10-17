import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collapseVariants, tFast } from '../motion';
import { gsap } from '../animation/gsap';
import { ease } from '../animation/easings';
import { useGsapScope } from '../animation/useGsapContext';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  Loader2,
  UsersRound,
  Check,
  Shield,
  Feather
} from 'lucide-react';

export const LoginPage: React.FC<{ entranceReady?: boolean }> = ({ entranceReady = true }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [selectedDemoEmail, setSelectedDemoEmail] = useState<string | null>(null);

  // One GSAP timeline owns the whole entrance (replaces the old CSS .m-rise stagger).
  // Content is only hidden once the timeline exists, and it plays when the boot loader has
  // left (`entranceReady`), so the two never overlap. Reduced motion shows content as-is.
  const entrance = useRef<gsap.core.Timeline | null>(null);
  const pageRef = useGsapScope<HTMLDivElement>(({ q, reduced }) => {
    if (reduced) return;
    const items = q<HTMLElement>('[data-enter]').filter(el => el.offsetParent !== null);
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      items,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.34, ease: ease.out, stagger: 0.035, clearProps: 'opacity,transform' }
    );
    entrance.current = tl;
    return () => { entrance.current = null; };
  }, []);
  useLayoutEffect(() => {
    if (entranceReady) entrance.current?.play();
  }, [entranceReady]);

  const handleLogin = async (loginEmail: string, loginPass = 'password123') => {
    try {
      setLoading(true);
      setError(null);
      await login(loginEmail, loginPass);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please provide your email address.');
      return;
    }
    handleLogin(email, password);
  };

  const handleSelectDemo = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setSelectedDemoEmail(demoEmail);
    setError(null);
    setTimeout(() => {
      setSelectedDemoEmail(null);
    }, 2500);
  };

  // Curated demo personas for assignment grading
  const demoAccounts = [
    {
      role: 'Operations Admin',
      name: 'Sarah Jenkins',
      email: 'admin@bookleafpub.com',
      badge: 'Operations Desk',
      sub: 'Triage queue, AI draft generator & override access',
      icon: Shield
    },
    {
      role: 'Author',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      badge: 'Author Studio',
      sub: 'Published: "Whispers of the Ganges" · ₹3,570 pending royalty',
      icon: Feather
    },
    {
      role: 'Author',
      name: 'Sneha Kulkarni',
      email: 'sneha.kulkarni@email.com',
      badge: 'Production Stage',
      sub: 'Book: "Midnight in Mysore" currently in Production',
      icon: Feather
    },
    {
      role: 'Author',
      name: 'Ananya Reddy',
      email: 'ananya.reddy@email.com',
      badge: 'Author Studio',
      sub: 'Threshold edge case: ₹2,546 pending royalty, 0 paid yet',
      icon: Feather
    }
  ];

  return (
    <div className="login-split-page" ref={pageRef}>
      {/* ============================================================
          LEFT SIDE: 55% BRAND & EDITORIAL PANEL
          ============================================================ */}
      <div className="login-editorial-panel">
        {/* Subtle geometric publishing art / paper layers in the background */}
        <div
          style={{
            position: 'absolute',
            right: '-10%',
            bottom: '-5%',
            width: '420px',
            height: '520px',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(20, 51, 37, 0.15) 100%)',
            transform: 'rotate(6deg)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '-6%',
            bottom: '0%',
            width: '400px',
            height: '500px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '4px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(20, 51, 37, 0.08) 100%)',
            transform: 'rotate(12deg)',
            pointerEvents: 'none'
          }}
        />

        {/* Top: BookLeaf Wordmark */}
        <div
          data-enter
          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', position: 'relative', zIndex: 2 }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 'var(--radius-md)',
              background: 'var(--brand-500)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)'
            }}
          >
            <BookOpen size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.2rem',
                fontWeight: 600,
                letterSpacing: '-0.01em',
                lineHeight: 1.15
              }}
            >
              BookLeaf Publishing
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                color: 'rgba(255, 255, 255, 0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 500
              }}
            >
              Author & Operations Portal
            </span>
          </div>
        </div>

        {/* Center: Editorial Serif Headline & Publishing Quote Motif */}
        <div style={{ margin: 'auto 0', maxWidth: '520px', position: 'relative', zIndex: 2 }}>
          <div>
            {/* Elegant oversized quotation motif */}
            <div
              data-enter
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '4.5rem',
                lineHeight: 0.7,
                color: 'rgba(64, 145, 108, 0.35)',
                marginBottom: '0.75rem',
                userSelect: 'none'
              }}
            >
              “
            </div>

            <h1
              data-enter
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '2.75rem',
                fontWeight: 500,
                lineHeight: 1.15,
                color: '#FFFFFF',
                letterSpacing: '-0.025em',
                marginBottom: '1.25rem'
              }}
            >
              Stories deserve
              <br />
              <span style={{ fontStyle: 'italic', color: '#86EFAC' }}>thoughtful support.</span>
            </h1>

            <p
              data-enter
              style={{
                fontSize: '0.96rem',
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: 1.6,
                maxWidth: '460px',
                marginBottom: '2rem'
              }}
            >
              Manage your manuscripts, global distribution, quarterly royalties, and direct conversations with BookLeaf coordinators from one unified editorial workspace.
            </p>

            {/* Restrained Publishing Pillars / Badges */}
            <div data-enter style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#FFFFFF' }}>
                  80 / 20
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  Net Profit Royalty Model
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
              <div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#FFFFFF' }}>
                  48 Hours
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  ISBN & Distribution SLA
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.08)' }} />
              <div>
                <div style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', fontWeight: 600, color: '#FFFFFF' }}>
                  Real-Time
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.45)' }}>
                  SSE Live Streaming
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Editorial Fineprint */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: 'rgba(255, 255, 255, 0.35)',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            paddingTop: '1rem',
            position: 'relative',
            zIndex: 2
          }}
        >
          <span>New Delhi & US Publishing Distribution Hubs</span>
          <span>© BookLeaf Publishing</span>
        </div>
      </div>

      {/* ============================================================
          RIGHT SIDE: 45% AUTHENTICATION PANEL
          ============================================================ */}
      <div className="login-auth-panel">
        <div className="login-auth-content">
          {/* Mobile-only wordmark header */}
          <div className="mobile-only-brand" data-enter style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-600)',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '0.5rem'
              }}
            >
              <BookOpen size={20} />
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 600 }}>
              BookLeaf Publishing
            </div>
          </div>

          <div>
            {/* Header */}
            <div data-enter style={{ marginBottom: '1.75rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.75rem',
                  fontWeight: 600,
                  color: 'var(--text-highlight)',
                  letterSpacing: '-0.02em',
                  marginBottom: '0.35rem'
                }}
              >
                Welcome back
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
                Sign in to continue to your BookLeaf workspace.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={tFast}
                  style={{
                    background: 'var(--priority-critical-bg)',
                    border: '1px solid var(--priority-critical-border)',
                    color: 'var(--priority-critical-text)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.25rem',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  role="alert"
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate data-enter>
              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="login-email">
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: 36, fontSize: '0.86rem' }}
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="login-password" style={{ margin: 0 }}>
                    Password
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Demo: <code>password123</code>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingLeft: 36, paddingRight: 38, fontSize: '0.86rem' }}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <span key={showPassword ? 'hide' : 'show'} className="icon-swap">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                  </button>
                </div>
              </div>

              {/* Primary CTA Button */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.65rem 1rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                disabled={loading}
              >
                {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                {!loading && <ArrowRight size={16} className="btn-arrow-icon" />}
              </button>
            </form>

            {/* ============================================================
                DEMO ACCESS DISCLOSURE (COLLAPSIBLE)
                ============================================================ */}
            <div data-enter style={{ marginTop: '1.75rem' }}>
              <div className="demo-disclosure">
                <button
                  type="button"
                  className="demo-disclosure-trigger"
                  onClick={() => setIsDemoOpen(!isDemoOpen)}
                  aria-expanded={isDemoOpen}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <UsersRound size={16} className="icon-brand" />
                    <span>Demo access (1-click evaluation personas)</span>
                  </div>
                  <ChevronDown size={16} className={`icon-muted icon-rotate ${isDemoOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>

                <AnimatePresence initial={false}>
                  {isDemoOpen && (
                    <motion.div
                      variants={collapseVariants}
                      initial="closed"
                      animate="open"
                      exit="closed"
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="demo-disclosure-list">
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.15rem 0.25rem', marginBottom: 2 }}>
                          Select an account below to automatically fill credentials:
                        </div>

                        {demoAccounts.map(account => {
                          const isPopulated = selectedDemoEmail === account.email || email === account.email;
                          const IconComp = account.icon;

                          return (
                            <button
                              key={account.email}
                              type="button"
                              className="demo-account-row"
                              onClick={() => handleSelectDemo(account.email, account.role)}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    width: 26,
                                    height: 26,
                                    borderRadius: 'var(--radius-sm)',
                                    background: account.role.includes('Admin') ? 'var(--accent-gold-bg)' : 'var(--brand-subtle-bg)',
                                    color: account.role.includes('Admin') ? 'var(--accent-gold)' : 'var(--brand-700)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  <IconComp size={14} />
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-highlight)' }}>
                                      {account.name}
                                    </span>
                                    <span
                                      className="badge"
                                      style={{
                                        fontSize: '0.62rem',
                                        padding: '0px 5px',
                                        background: account.role.includes('Admin') ? 'var(--accent-gold-bg)' : 'var(--brand-50)',
                                        color: account.role.includes('Admin') ? 'var(--accent-gold)' : 'var(--brand-700)',
                                        borderColor: account.role.includes('Admin') ? 'var(--priority-medium-border)' : 'var(--border-accent)'
                                      }}
                                    >
                                      {account.badge}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {account.sub}
                                  </div>
                                </div>
                              </div>

                              <div style={{ marginLeft: '0.5rem', flexShrink: 0 }}>
                                {isPopulated ? (
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      fontSize: '0.68rem',
                                      color: 'var(--brand-700)',
                                      fontWeight: 600
                                    }}
                                  >
                                    <Check size={12} />
                                    <span>Selected</span>
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fill</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Discreet footer */}
            <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Protected by BookLeaf Role-Based Access · Enterprise Author Support
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
