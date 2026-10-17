import React, { useEffect, useState } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from '../../types';
import { api } from '../../services/api';
import { useRealtime } from '../../context/RealtimeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  Search,
  Filter,
  Flame,
  Clock,
  Sparkles,
  Ticket as TicketIcon,
  ChevronRight,
  AlertTriangle,
  User as UserIcon,
  BookOpen
} from 'lucide-react';

interface Props {
  onSelectTicket: (ticketId: string) => void;
}

export const TicketQueuePage: React.FC<Props> = ({ onSelectTicket }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const { subscribeToTickets } = useRealtime();

  const fetchTickets = async () => {
    try {
      const res = await api.getTickets({
        status: statusFilter !== 'all' ? (statusFilter as TicketStatus) : undefined,
        category: categoryFilter !== 'all' ? (categoryFilter as TicketCategory) : undefined,
        priority: priorityFilter !== 'all' ? (priorityFilter as TicketPriority) : undefined,
        search: search.trim() || undefined
      });
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching admin tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, categoryFilter, priorityFilter]);

  // Handle search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTickets();
    }, 250);
    return () => clearTimeout(handler);
  }, [search]);

  // Subscribe to real-time events
  useEffect(() => {
    const unsubscribe = subscribeToTickets((updatedTicket, eventType) => {
      setTickets(prev => {
        const idx = prev.findIndex(t => t.ticket_id === updatedTicket.ticket_id);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updatedTicket;
          return next;
        } else {
          return [updatedTicket, ...prev];
        }
      });

      if (eventType === 'ticket_created') {
        setRealtimeNotification(`⚡ New incoming query from ${updatedTicket.author_name} (AI Priority: ${updatedTicket.priority})`);
      } else if (eventType === 'new_message') {
        setRealtimeNotification(`💬 New reply on ticket ${updatedTicket.ticket_id}`);
      }
      setTimeout(() => setRealtimeNotification(null), 5000);
    });

    return () => unsubscribe();
  }, [subscribeToTickets]);

  const categories: TicketCategory[] = [
    'Royalty & Payments',
    'ISBN & Metadata Issues',
    'Printing & Quality',
    'Distribution & Availability',
    'Book Status & Production Updates',
    'General Inquiry'
  ];

  const totalCritical = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const totalHigh = tickets.filter(t => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const totalUnresolved = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

  return (
    <div>
      {/* Top Banner & KPI Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Author Support & Triage Operations Queue</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            AI auto-classified queries with real-time streaming and BookLeaf Knowledge Base response engine.
          </p>
        </div>

        {realtimeNotification && (
          <div
            style={{
              background: 'linear-gradient(90deg, #0d9488, #0284c7)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.4)',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {realtimeNotification}
          </div>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>UNRESOLVED QUEUE</span>
            <Clock size={16} color="#fbbf24" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.35rem' }}>
            {totalUnresolved}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Oldest unresolved sorted first</span>
        </div>

        <div className="card" style={{ border: totalCritical > 0 ? '1px solid rgba(244, 63, 94, 0.4)' : undefined }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>CRITICAL REVENUE BLOCKERS</span>
            <Flame size={16} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f43f5e', marginTop: '0.35rem' }}>
            {totalCritical}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#f43f5e' }}>e.g. Amazon "Currently Unavailable"</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>HIGH PRIORITY TICKETS</span>
            <AlertTriangle size={16} color="#fb923c" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#fb923c', marginTop: '0.35rem' }}>
            {totalHigh}
          </div>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ISBN errors, royalties &gt; ₹1,000, misprints</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}>
            <span>AI ASSISTED COVERAGE</span>
            <Sparkles size={16} className="text-brand" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#2dd4bf', marginTop: '0.35rem' }}>
            100%
          </div>
          <span style={{ fontSize: '0.72rem', color: '#2dd4bf' }}>Auto-classified & draft prepared</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="card mb-4"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        {/* Search */}
        <div style={{ flex: '1 1 240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '32px' }}
            placeholder="Search by ticket ID, author, book, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div style={{ minWidth: '140px' }}>
          <select
            className="form-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        <div style={{ minWidth: '180px' }}>
          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {(statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || search) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setCategoryFilter('all');
              setSearch('');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Ticket List Table */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading ticket queue...</div>
      ) : tickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <TicketIcon size={40} style={{ color: '#64748b', margin: '0 auto 0.75rem' }} />
          <h3>No tickets match your filter criteria</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Try clearing filters or search query.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Priority</th>
                  <th style={{ width: '110px' }}>Status</th>
                  <th>Query Details & Subject</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Assignee</th>
                  <th>Age / Created</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(ticket => {
                  const isCritical = ticket.priority === 'Critical';
                  const isHigh = ticket.priority === 'High';
                  const isUnresolved = ticket.status === 'Open' || ticket.status === 'In Progress';

                  return (
                    <tr
                      key={ticket.ticket_id}
                      onClick={() => onSelectTicket(ticket.ticket_id)}
                      style={{
                        cursor: 'pointer',
                        background: isCritical && isUnresolved ? 'rgba(244, 63, 94, 0.05)' : undefined
                      }}
                    >
                      <td>
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      <td>
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                          {ticket.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                          <span style={{ fontFamily: 'monospace' }}>{ticket.ticket_id}</span>
                          {ticket.book_title && (
                            <span>📖 {ticket.book_title}</span>
                          )}
                          <span>{ticket.messages.length} {ticket.messages.length === 1 ? 'msg' : 'msgs'}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{ticket.author_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ticket.author_email}</div>
                      </td>

                      <td>
                        <span className="badge badge-category" style={{ fontSize: '0.72rem' }}>
                          {ticket.category}
                        </span>
                        {ticket.category_overridden && (
                          <span style={{ fontSize: '0.65rem', color: '#fb923c', display: 'block', marginTop: 2 }}>
                            (Overridden)
                          </span>
                        )}
                      </td>

                      <td>
                        {ticket.assigned_to_name ? (
                          <span style={{ fontSize: '0.8rem', color: '#2dd4bf', fontWeight: 500 }}>
                            {ticket.assigned_to_name}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Unassigned</span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectTicket(ticket.ticket_id);
                          }}
                        >
                          Triage & AI Draft
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
