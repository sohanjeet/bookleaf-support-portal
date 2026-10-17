import React, { useEffect, useState } from 'react';
import { Book } from '../../types';
import { api } from '../../services/api';
import { BookOpen, AlertCircle, ShoppingBag, IndianRupee, Layers } from 'lucide-react';

export const MyBooksPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyBooks()
      .then(res => setBooks(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading published titles...</div>;
  }

  if (error) {
    return (
      <div className="card" style={{ border: '1px solid #f43f5e' }}>
        <p style={{ color: '#fb7185' }}>Error loading books: {error}</p>
      </div>
    );
  }

  // Summary royalty calculations
  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);
  const totalCopiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>My Published Titles & Royalties</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Track sales, retail availability, production milestones, and quarterly payout disbursements.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Titles</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {books.length}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#2dd4bf' }}>
            {books.filter(b => b.status === 'Published & Live').length} Live in distribution
          </span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Total Copies Sold</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.25rem' }}>
            {totalCopiesSold.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Across Amazon, Flipkart & Store</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Royalty Earned</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399', marginTop: '0.25rem' }}>
            ₹{totalEarned.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>80% Net profit share</span>
        </div>

        <div className="card" style={{ border: totalPending > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : undefined }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Royalty Pending</span>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.25rem' }}>
            ₹{totalPending.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '0.72rem', color: totalPending >= 1000 ? '#34d399' : '#94a3b8' }}>
            {totalPending >= 1000 ? 'Eligible for next quarterly cycle' : 'Rolls over (< ₹1,000 min threshold)'}
          </span>
        </div>
      </div>

      {/* Books Table / Detailed Cards */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={18} className="text-brand" />
            Book Catalog Details
          </h3>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Book Title & ISBN</th>
                <th>Genre</th>
                <th>Status</th>
                <th>MRP / Royalty</th>
                <th>Copies Sold</th>
                <th>Earned / Paid</th>
                <th>Pending</th>
                <th>Distribution Platforms</th>
              </tr>
            </thead>
            <tbody>
              {books.map(book => {
                const isInProduction = book.status.includes('In Production');
                return (
                  <tr key={book.book_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{book.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        ISBN: {book.isbn || 'Pending Assignment'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        ID: {book.book_id} • Pub Date: {book.publication_date || 'In Production'}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-category">{book.genre}</span>
                    </td>

                    <td>
                      {isInProduction ? (
                        <span
                          className="badge"
                          style={{
                            background: 'rgba(251, 146, 60, 0.15)',
                            color: '#fb923c',
                            border: '1px solid rgba(251, 146, 60, 0.3)'
                          }}
                        >
                          <Layers size={12} style={{ marginRight: 3 }} />
                          {book.status}
                        </span>
                      ) : (
                        <span className="badge badge-resolved">
                          ● {book.status}
                        </span>
                      )}
                    </td>

                    <td>
                      {book.mrp ? (
                        <div>
                          <strong>₹{book.mrp}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Royalty: ₹{book.author_royalty_per_copy}/copy
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.8rem' }}>TBD at launch</span>
                      )}
                    </td>

                    <td>
                      <strong style={{ color: book.total_copies_sold > 0 ? '#f8fafc' : '#64748b' }}>
                        {book.total_copies_sold.toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>
                      <div>
                        <div style={{ color: '#34d399', fontWeight: 600 }}>₹{book.total_royalty_earned.toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Paid: ₹{book.royalty_paid.toLocaleString('en-IN')}</div>
                      </div>
                    </td>

                    <td>
                      <strong style={{ color: book.royalty_pending > 0 ? '#fbbf24' : '#64748b' }}>
                        ₹{book.royalty_pending.toLocaleString('en-IN')}
                      </strong>
                      {book.last_royalty_payout_date && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Last: {book.last_royalty_payout_date}
                        </div>
                      )}
                    </td>

                    <td>
                      {book.available_on && book.available_on.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {book.available_on.map((ch, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#cbd5e1',
                                border: '1px solid var(--border-subtle)'
                              }}
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Pending distribution setup
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
