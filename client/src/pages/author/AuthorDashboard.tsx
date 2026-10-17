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
  Sparkles,
  ArrowRight,
  ShieldCheck
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
  const totalRoyaltyPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);
  const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="card mb-6"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(13, 148, 136, 0.18) 100%)',
          border: '1px solid rgba(20, 184, 166, 0.3)',
          padding: '1.75rem 2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-ai" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Author Portal
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ID: {user?.author_id || user?.id}</span>
            </div>
            <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem' }}>
              Welcome back, {user?.name}
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
              {user?.city ? `Author from ${user.city} • ` : ''}Member since {user?.joined_date || '2023'} • BookLeaf Publishing
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => onNavigateTab('books')}>
              <BookOpen size={16} />
              View My Books ({books.length})
            </button>
            <button className="btn btn-primary" onClick={onOpenSubmitModal}>
              <PlusCircle size={16} />
              Raise Support Ticket
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>PUBLISHED TITLES</span>
            <BookOpen size={16} className="text-brand" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.4rem' }}>
            {books.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            {books.filter(b => b.status === 'Published & Live').length} active in distribution
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL COPIES SOLD</span>
            <ShoppingBag size={16} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.4rem' }}>
            {totalCopiesSold.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            Across Amazon, Flipkart, BookLeaf
          </span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>TOTAL ROYALTY EARNED</span>
            <IndianRupee size={16} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#34d399', marginTop: '0.4rem' }}>
            ₹{totalRoyaltyEarned.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
            80/20 net profit share
          </span>
        </div>

        <div className="card" style={{ border: totalRoyaltyPending > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>ROYALTY PENDING</span>
            <Clock size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.4rem' }}>
            ₹{totalRoyaltyPending.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: totalRoyaltyPending >= 1000 ? '#34d399' : '#94a3b8' }}>
            {totalRoyaltyPending >= 1000 ? '✓ Ready for quarterly payout' : 'Rolls over (< ₹1,000 threshold)'}
          </span>
        </div>
      </div>

      {/* Two Columns: Recent Support Tickets & Book Status Highlights */}
      <div className="grid grid-cols-2 gap-6">
        {/* Support Tickets Section */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TicketIcon size={18} className="text-brand" />
              Active Support Inquiries
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('tickets')}>
              View All ({tickets.length})
            </button>
          </div>

          {activeTickets.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
              <ShieldCheck size={32} color="#34d399" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem' }}>No pending support tickets.</p>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>All queries are resolved or closed.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {activeTickets.map(t => (
                <div
                  key={t.ticket_id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '0.9rem 1rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => onNavigateTab('tickets')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>{t.ticket_id}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.35rem', color: '#f8fafc' }}>
                    {t.subject}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>{t.category}</span>
                    <span>{t.messages.length} messages</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BookLeaf Policy Guidelines & Turnaround Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Sparkles size={18} className="text-brand" />
              BookLeaf Author Support SLA
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', padding: '6px', borderRadius: '6px' }}>
                <Clock size={16} />
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>48-Hour Resolution Guarantee:</strong>
                <p style={{ color: '#94a3b8', margin: '2px 0 0' }}>
                  Critical issues such as ISBN metadata mismatches and unavailable retail listings are prioritized and resolved within 24 to 48 hours.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '6px', borderRadius: '6px' }}>
                <IndianRupee size={16} />
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>Quarterly Royalty Cycle:</strong>
                <p style={{ color: '#94a3b8', margin: '2px 0 0' }}>
                  Royalties (80% net profit share) are paid within 45 days of each quarter ending for balances exceeding the ₹1,000 threshold.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '6px', borderRadius: '6px' }}>
                <ShieldCheck size={16} />
              </div>
              <div>
                <strong style={{ color: '#f8fafc' }}>100% Free Print Defect Reprints:</strong>
                <p style={{ color: '#94a3b8', margin: '2px 0 0' }}>
                  If author copies have binding flaws or misprints, simply attach photos in a support ticket for an immediate free reprint dispatched in 5–7 days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
