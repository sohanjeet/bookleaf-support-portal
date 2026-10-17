import { CountUp } from '../../components/CountUp';
import React, { useEffect, useState } from 'react';
import { Book } from '../../types';
import { api } from '../../services/api';
import { Layers, Search, BookOpen, ShoppingBag, IndianRupee, Filter, X, CheckCircle2 } from 'lucide-react';

export const AdminBooksCatalog: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.getMyBooks()
      .then(res => setBooks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
  const totalRoyalties = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const inProductionCount = books.filter(b => b.status.includes('In Production')).length;
  const liveCount = books.filter(b => b.status === 'Published & Live').length;

  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(search.toLowerCase())) ||
      (b.author_id && b.author_id.toLowerCase().includes(search.toLowerCase())) ||
      (b.genre && b.genre.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'production') return b.status.includes('In Production');
    if (filterStatus === 'live') return b.status === 'Published & Live';
    return true;
  });

  return (
    <div className="m-stagger">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Author Catalog & Publications</h1>
            <p className="page-subtitle">
              Publishing pipeline oversight across all registered authors, ISBN registries, retail fulfillment partners, and aggregate sales figures.
            </p>
          </div>
        </div>
      </div>

      {/* Catalog Overview Ledger (Replaces generic 4 cards) */}
      <div
        className="card mb-6"
        style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Master Catalog
            </div>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)' }}>
              <CountUp value={books.length} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--brand-700)', marginTop: '0.2rem' }}>
              {liveCount} Live in distribution
            </div>
          </div>

          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Production Pipeline
            </div>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: inProductionCount > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
              <CountUp value={inProductionCount} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Typesetting & ISBN proofing
            </div>
          </div>

          <div style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Total Circulation
            </div>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--text-highlight)' }}>
              <CountUp value={totalSold} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Copies ordered globally
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>
              Author Royalty Volume
            </div>
            <div style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 500, fontVariantNumeric: 'lining-nums tabular-nums', letterSpacing: '-0.015em', color: 'var(--status-resolved-text)' }}>
              <CountUp value={totalRoyalties} prefix="₹" />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Cumulative author earnings
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 260px', minWidth: 200 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-control"
            placeholder="Filter title, ISBN, author ID, genre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.2rem', fontSize: '0.82rem' }}
          />
          {search && (
            <button aria-label="Clear search"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          {[
            { key: 'all', label: 'All Titles' },
            { key: 'live', label: 'Live' },
            { key: 'production', label: 'In Production' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`btn btn-sm ${filterStatus === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(tab.key)}
              style={{ fontSize: '0.76rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books Table */}
      <div className="table-container">
        {filteredBooks.length === 0 ? (
          <div className="m-fade" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No titles matched the search criteria.
          </div>
        ) : (
          <table key={filterStatus} className="table m-swap">
            <thead>
              <tr>
                <th>Title & ISBN</th>
                <th style={{ width: '130px' }}>Author ID</th>
                <th style={{ width: '140px' }}>Genre</th>
                <th style={{ width: '150px' }}>Status</th>
                <th style={{ width: '110px' }}>Retail MRP</th>
                <th style={{ width: '110px' }}>Circulation</th>
                <th style={{ width: '130px' }}>Author Royalty</th>
                <th>Channels</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map(book => {
                const isInProduction = book.status.includes('In Production');
                return (
                  <tr key={book.book_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-highlight)', fontSize: '0.88rem' }}>
                        {book.title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', marginTop: 2 }}>
                        ISBN: {book.isbn || 'Pending'}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.74rem', color: 'var(--brand-700)', fontWeight: 600 }}>
                        {book.author_id}
                      </span>
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
                    </td>

                    <td>
                      <strong style={{ color: 'var(--text-highlight)', fontSize: '0.84rem' }}>
                        ₹{book.mrp || '—'}
                      </strong>
                    </td>

                    <td>
                      <strong style={{ color: 'var(--text-highlight)', fontSize: '0.86rem', fontVariantNumeric: 'tabular-nums' }}>
                        {(book.total_copies_sold || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--status-resolved-text)', fontVariantNumeric: 'tabular-nums' }}>
                        ₹{(book.total_royalty_earned || 0).toLocaleString('en-IN')}
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
        )}
      </div>
    </div>
  );
};
