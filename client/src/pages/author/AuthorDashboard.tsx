import { CountUp } from '../../components/CountUp';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Book, Ticket } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  BookOpen,
  IndianRupee,
  ShoppingBag,
  Ticket as TicketIcon,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Layers,
} from 'lucide-react';

interface Props {
  onNavigateTab: (tab: string) => void;
  onOpenSubmitModal: () => void;
}

export const AuthorDashboard: React.FC<Props> = ({ onNavigateTab, onOpenSubmitModal }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.getMyBooks(), api.getTickets()])
      .then(([booksRes, ticketsRes]) => {
        setBooks(booksRes.data);
        setTickets(ticketsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalCopiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const totalRoyaltyEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalRoyaltyPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
  const totalRoyaltyPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);
  const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');

  return (
    <div className="m-stagger">
      {/* Editorial Welcome Header */}
      <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--brand-700)',
                  background: 'var(--brand-50)',
                  border: '1px solid var(--border-accent)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)'
                }}
              >
                Author Studio
              </span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {user?.author_id ? `ID: ${user.author_id}` : ''} {user?.city ? `· ${user.city} Hub` : ''}
              </span>
            </div>

            <h1 className="page-title">
              Welcome back, {user?.name}
            </h1>
            <p className="page-subtitle" style={{ maxWidth: '640px' }}>
              Here is your publishing overview. Track manuscript sales across retail distribution networks, review royalty statements, and manage editorial communications.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => onNavigateTab('books')}>
              <BookOpen size={16} />
              <span>My Books ({books.length})</span>
            </button>
            <button className="btn btn-primary" onClick={onOpenSubmitModal}>
              <PlusCircle size={16} />
              <span>Raise Support Query</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial & Royalty Ledger — Clean Typography & Divider-based Layout */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2>
              Publishing & Royalty Statement
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              80/20 Net Profit Share Model · Quarterly Disbursements
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
            Real-Time Accounting
          </span>
        </div>

        {/* Minimalist 4-Column Metric Strip (Divider-based, Not Nested Cards) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xs)',
            overflow: 'hidden'
          }}
        >
          {/* Published Catalog */}
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Published Catalog
            </div>
            <div style={{ fontSize: '2.1rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)', lineHeight: 1.15 }} className="tabular-nums">
              <CountUp value={books.length} />
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--brand-700)', marginTop: '0.35rem', fontWeight: 500 }}>
              {books.filter(b => b.status === 'Published & Live').length} live in global distribution
            </div>
          </div>

          {/* Circulation */}
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Total Circulation
            </div>
            <div style={{ fontSize: '2.1rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)', lineHeight: 1.15 }} className="tabular-nums">
              <CountUp value={totalCopiesSold} />
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              Paperback & Kindle copies sold
            </div>
          </div>

          {/* Royalty Earned & Paid */}
          <div style={{ padding: '1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Royalty Earned
            </div>
            <div style={{ fontSize: '2.1rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--status-resolved-text)', lineHeight: 1.15 }} className="tabular-nums">
              <CountUp value={totalRoyaltyEarned} prefix="₹" />
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              ₹{totalRoyaltyPaid.toLocaleString('en-IN')} disbursed to date
            </div>
          </div>

          {/* Pending Payout */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.4rem' }}>
              Pending Payout
            </div>
            <div style={{ fontSize: '2.1rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: totalRoyaltyPending > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)', lineHeight: 1.15 }} className="tabular-nums">
              <CountUp value={totalRoyaltyPending} prefix="₹" />
            </div>
            <div style={{ fontSize: '0.76rem', color: totalRoyaltyPending >= 1000 ? 'var(--status-resolved-text)' : 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
              {totalRoyaltyPending >= 1000 ? '✓ Ready for quarterly disbursement' : 'Threshold ₹1,000 (rolls over)'}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Manuscripts + Support Conversations */}
      <div className="stack-on-tablet" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        {/* Manuscripts & Production Pipeline */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>
              Manuscripts ({books.length})
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigateTab('books')}
              style={{ fontSize: '0.76rem', gap: '0.3rem' }}
            >
              <span>View Library</span>
              <ArrowRight size={16} className="btn-arrow-icon" />
            </button>
          </div>

          {books.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              No published manuscripts found for this profile.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {books.map(book => {
                const isLive = book.status === 'Published & Live';
                return (
                  <div
                    key={book.book_id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color var(--duration-fast) ease',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
                      {/* Elegant book spine motif */}
                      <div
                        style={{
                          width: 32,
                          height: 46,
                          borderRadius: '2px',
                          background: isLive ? 'var(--brand-700)' : 'var(--accent-gold)',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                          borderLeft: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        📖
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-highlight)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {book.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                          ISBN: {book.isbn || 'Pending'} · {book.genre}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span className={isLive ? 'badge badge-resolved' : 'badge badge-high'} style={{ fontSize: '0.7rem' }}>
                        {book.status}
                      </span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }} className="tabular-nums">
                        {book.total_copies_sold} copies · ₹{book.total_royalty_earned}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Support & Production Queries */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>
              Active Inquiries ({activeTickets.length})
            </h2>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigateTab('tickets')}
              style={{ fontSize: '0.76rem', gap: '0.3rem' }}
            >
              <span>All Inquiries</span>
              <ArrowRight size={16} className="btn-arrow-icon" />
            </button>
          </div>

          {tickets.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
              <CheckCircle size={24} style={{ color: 'var(--status-resolved-text)', margin: '0 auto 0.5rem', display: 'block' }} />
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-highlight)' }}>No open inquiries</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0 1rem' }}>
                All author queries are up to date and resolved.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={onOpenSubmitModal}>
                <PlusCircle size={16} />
                <span>Ask a Question</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {tickets.slice(0, 4).map(ticket => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => onNavigateTab('tickets')}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '0.9rem 1.15rem',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-500)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--brand-700)', fontWeight: 600 }}>
                      {ticket.ticket_id}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-highlight)', marginBottom: '0.25rem' }}>
                    {ticket.subject}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{ticket.category}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
