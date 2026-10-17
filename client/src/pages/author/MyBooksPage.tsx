import { CountUp } from '../../components/CountUp';
import React, { useEffect, useState } from 'react';
import { Book } from '../../types';
import { api } from '../../services/api';
import {
  BookOpen,
  LayoutGrid,
  List,
  CheckCircle2,
  Layers,
  ShoppingBag,
  IndianRupee,
  Clock,
} from 'lucide-react';

export const MyBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    api.getMyBooks()
      .then(res => setBooks(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading your published titles...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ border: '1px solid var(--priority-critical-border)', background: 'var(--priority-critical-bg)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--priority-critical-text)' }}>
        Error loading books: {error}
      </div>
    );
  }

  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);
  const totalCopiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const liveCount = books.filter(b => b.status === 'Published & Live').length;
  const inProductionCount = books.filter(b => b.status.includes('In Production')).length;

  return (
    <div className="m-stagger">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Author Library & Royalties</h1>
            <p className="page-subtitle">
              Your published catalog across global distribution networks. Track retail circulation, review ISBN status, and monitor royalties.
            </p>
          </div>

          {/* View Mode Toggle: Library Grid vs Ledger Table */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('grid')}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', gap: '0.35rem' }}
              title="Library Grid View"
            >
              <LayoutGrid size={16} />
              <span>Library</span>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setViewMode('table')}
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.76rem', gap: '0.35rem' }}
              title="Ledger Table View"
            >
              <List size={16} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-xs)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
            Catalog Size
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)' }} className="tabular-nums">
            <CountUp value={books.length} /> {books.length === 1 ? 'Title' : 'Titles'}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--brand-700)', marginTop: '0.2rem' }}>
            {liveCount} Live in distribution {inProductionCount > 0 ? `· ${inProductionCount} in production` : ''}
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
            Total Circulation
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)' }} className="tabular-nums">
            <CountUp value={totalCopiesSold} />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Copies ordered across retail networks
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
            Cumulative Royalty
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--status-resolved-text)' }} className="tabular-nums">
            <CountUp value={totalEarned} prefix="₹" />
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            ₹{totalPaid.toLocaleString('en-IN')} disbursed to date
          </div>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
            Pending Disbursement
          </div>
          <div style={{ fontSize: '1.85rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: totalPending > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)' }} className="tabular-nums">
            <CountUp value={totalPending} prefix="₹" />
          </div>
          <div style={{ fontSize: '0.74rem', color: totalPending >= 1000 ? 'var(--status-resolved-text)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
            {totalPending >= 1000 ? '✓ Scheduled for next quarterly payout' : 'Threshold ₹1,000 (rolls over)'}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: EDITORIAL LIBRARY GRID */}
      {viewMode === 'grid' ? (
        <div key="grid" className="m-swap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {books.map(book => {
            const isLive = book.status === 'Published & Live';
            return (
              <div
                key={book.book_id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease, transform var(--dur-fast) var(--ease-out)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand-500)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
              >
                <div style={{ display: 'flex', gap: '1.15rem' }}>
                  {/* Book Spine / Cover Mockup */}
                  <div
                    style={{
                      width: 72,
                      height: 104,
                      borderRadius: '3px',
                      background: isLive
                        ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                        : 'linear-gradient(135deg, #78350F 0%, #B45309 100%)',
                      color: '#FFFFFF',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '0.5rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.18)',
                      borderLeft: '3px solid rgba(255, 255, 255, 0.4)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.85 }}>
                      BookLeaf
                    </div>
                    <div style={{ fontSize: '0.68rem', fontWeight: 600, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                      {book.title}
                    </div>
                    <div style={{ fontSize: '0.58rem', opacity: 0.7 }}>
                      {book.genre}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: '0.4rem' }}>
                      <span className={isLive ? 'badge badge-resolved' : 'badge badge-high'} style={{ fontSize: '0.68rem' }}>
                        {isLive ? <CheckCircle2 size={12} /> : <Layers size={10} />}
                        <span>{book.status}</span>
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: 'var(--text-highlight)',
                        lineHeight: 1.3,
                        marginBottom: '0.25rem',
                        fontFamily: 'var(--font-heading)'
                      }}
                    >
                      {book.title}
                    </h3>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                      ISBN: {book.isbn || 'Pending Imprint'}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      Genre: <strong>{book.genre}</strong>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Published: <strong>{book.publication_date ? new Date(book.publication_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet published'}</strong>
                      {' · '}MRP: <strong>{book.mrp ? `₹${book.mrp}` : '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* Ledger metrics inside book card */}
                <div
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 0.9rem',
                    border: '1px solid var(--border-subtle)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    textAlign: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Sold
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-highlight)' }} className="tabular-nums">
                      {(book.total_copies_sold || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Earned
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--status-resolved-text)' }} className="tabular-nums">
                      ₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Paid
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-highlight)' }} className="tabular-nums">
                      ₹{(book.royalty_paid || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pending
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: (book.royalty_pending || 0) > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }} className="tabular-nums">
                      ₹{(book.royalty_pending || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Distribution Channels */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Retail Platforms:</span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {book.available_on && book.available_on.length > 0 ? (
                      book.available_on.map((ch: string, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.65rem',
                            padding: '1px 5px',
                            borderRadius: 'var(--radius-xs)',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {ch}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: '0.7rem' }}>Not yet distributed</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW MODE 2: DENSE LEDGER TABLE */
        <div className="table-container">
          <table key="list" className="table m-swap">
            <thead>
              <tr>
                <th>Title & ISBN</th>
                <th style={{ width: '130px' }}>Genre</th>
                <th style={{ width: '150px' }}>Production Status</th>
                <th style={{ width: '130px' }}>MRP & Royalty</th>
                <th style={{ width: '110px' }}>Circulation</th>
                <th style={{ width: '120px' }}>Earned / Paid</th>
                <th style={{ width: '120px' }}>Pending</th>
                <th>Channels</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => {
                const isInProduction = book.status.includes('In Production');
                return (
                  <tr key={book.book_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-highlight)', fontSize: '0.88rem' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                        ISBN: {book.isbn || 'Pending Assignment'}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-category">{book.genre}</span>
                    </td>

                    <td>
                      {isInProduction ? (
                        <span className="badge badge-high" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Layers size={12} />
                          {book.status}
                        </span>
                      ) : (
                        <span className="badge badge-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} />
                          {book.status}
                        </span>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {book.publication_date ? `Published ${new Date(book.publication_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Publication date pending'}
                      </div>
                    </td>

                    <td>
                      {book.mrp ? (
                        <div>
                          <strong style={{ color: 'var(--text-highlight)', fontSize: '0.84rem' }}>₹{book.mrp}</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            Royalty: ₹{book.author_royalty_per_copy || 50}/copy
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>In Pipeline</span>
                      )}
                    </td>

                    <td>
                      <strong style={{ color: 'var(--text-highlight)', fontSize: '0.88rem' }} className="tabular-nums">
                        {(book.total_copies_sold || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }} className="tabular-nums">
                        ₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="tabular-nums">
                        Paid: ₹{(book.royalty_paid || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: (book.royalty_pending || 0) > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }} className="tabular-nums">
                        ₹{(book.royalty_pending || 0).toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {book.available_on && book.available_on.length > 0 ? (
                          book.available_on.map((ch: string, i: number) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: 'var(--radius-xs)',
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {ch}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not yet distributed</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
