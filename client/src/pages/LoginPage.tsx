import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Shield, User as UserIcon, Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (loginEmail: string, loginPass = 'password123') => {
    try {
      setLoading(true);
      setError(null);
      await login(loginEmail, loginPass);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter an email address.');
      return;
    }
    handleLogin(email, password);
  };

  // Quick 1-click test scenarios from sample dataset
  const quickTestLogins = [
    {
      role: 'Admin Operations',
      name: 'Ops Admin',
      email: 'admin@bookleafpub.com',
      badge: 'Admin Portal',
      desc: 'Full ticket triage queue, AI draft generator & override access'
    },
    {
      role: 'Author',
      name: 'Priya Sharma (AUTH001)',
      email: 'priya.sharma@email.com',
      badge: 'Author Portal',
      desc: '2 Published books, ₹3,570 pending royalty'
    },
    {
      role: 'Author',
      name: 'Sneha Kulkarni (AUTH007)',
      email: 'sneha.kulkarni@email.com',
      badge: 'Author Portal',
      desc: 'Edge case: Book "Midnight in Mysore" in Production'
    },
    {
      role: 'Author',
      name: 'Ananya Reddy (AUTH003)',
      email: 'ananya.reddy@email.com',
      badge: 'Author Portal',
      desc: 'Edge case: ₹2,546 pending royalty, 0 paid yet'
    }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.5rem',
        background: 'radial-gradient(ellipse at top, #0f172a 0%, #090d16 100%)'
      }}
    >
      <div style={{ maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            className="brand-icon-box"
            style={{ width: 54, height: 54, margin: '0 auto 1rem', borderRadius: '16px' }}
          >
            <BookOpen size={30} />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>BookLeaf Publishing</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Author Support & Communication Portal with AI-Assisted Operations
          </p>
        </div>

        {/* Login Card */}
        <div className="card" style={{ padding: '2rem' }}>
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid #f43f5e',
                color: '#fecdd3',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.85rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  placeholder="name@email.com or admin@bookleafpub.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: 36 }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="password123"
                  required
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 4, display: 'block' }}>
                Default demo password is pre-filled: <code>password123</code>
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick 1-Click Evaluation Logins */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <Sparkles size={14} className="text-brand" />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                1-Click Technical Evaluation Logins
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickTestLogins.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.65rem 0.9rem',
                    textAlign: 'left'
                  }}
                  onClick={() => handleLogin(item.email)}
                  disabled={loading}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f8fafc' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      {item.desc}
                    </div>
                  </div>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.68rem',
                      background: item.badge.includes('Admin') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(20, 184, 166, 0.15)',
                      color: item.badge.includes('Admin') ? '#fbbf24' : '#2dd4bf'
                    }}
                  >
                    {item.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
