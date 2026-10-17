import React, { useEffect, useState } from 'react';
import { Book } from '../../types';
import { api } from '../../services/api';
import { Layers, Search, BookOpen, User, IndianRupee } from 'lucide-react';

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

  const filteredBooks = books.filter(b => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.isbn.toLowerCase().includes(search.toLowerCase()) ||
      b.author_id.toLowerCase().includes(search.toLowerCase()) ||
      b.genre.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'production') return b.status.includes('In Production');
    if (filterStatus === 'live') return b.status === 'Published & Live';
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>BookLeaf Full Title Catalog ({books.length} Books)</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Complete catalog view of all 10 seeded authors, publication statuses, copies sold, and retail availability.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: 32 }}
            placeholder="Search title, ISBN, author ID, genre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            className="form-select"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="live">Published & Live</option>
            <option value="production">In Production</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading catalog...</div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title & ISBN</th>
                  <th>Author ID</th>
                  <th>Genre</th>
                  <th>Status</th>
                  <th>MRP</th>
                  <th>Sold</th>
                  <th>Royalty Earned / Pending</th>
                  <th>Print Partner</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map(b => (
                  <tr key={b.book_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>{b.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {b.isbn || 'TBD'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        {b.author_id}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-category">{b.genre}</span>
                    </td>
                    <td>
                      {b.status.includes('In Production') ? (
                        <span className="badge badge-high">{b.status}</span>
                      ) : (
                        <span className="badge badge-resolved">{b.status}</span>
                      )}
                    </td>
                    <td>{b.mrp ? `₹${b.mrp}` : '—'}</td>
                    <td>{b.total_copies_sold.toLocaleString('en-IN')}</td>
                    <td>
                      <div style={{ color: '#34d399', fontWeight: 600 }}>₹{b.total_royalty_earned.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Pending: ₹{b.royalty_pending.toLocaleString('en-IN')}</div>
                    </td>
                    <td>{b.print_partner || 'Pending'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {b.available_on.length > 0 ? (
                          b.available_on.map((p, i) => (
                            <span key={i} style={{ fontSize: '0.68rem', padding: '1px 5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
                              {p}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>None</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
