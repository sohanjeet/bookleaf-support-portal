import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tBase } from '../../motion';
import { Ticket, TicketStatus, TicketCategory, TicketPriority } from '../../types';
import { api } from '../../services/api';
import { useFreshItems } from '../../useFreshItems';
import { useRealtime } from '../../context/RealtimeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  Search,
  Flame,
  Clock,
  Ticket as TicketIcon,
  ChevronRight,
  AlertTriangle,
  BookOpen,
  X,
  CheckCircle2,
  Filter,
  RefreshCw,
  ArrowUpDown,
  UserCheck
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
  const [sortBy, setSortBy] = useState<'sla' | 'newest' | 'priority'>('sla');
  const [activeTab, setActiveTab] = useState<'all' | 'unresolved' | 'critical' | 'high' | 'resolved'>('all');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const { subscribeToTickets } = useRealtime();
  const freshTickets = useFreshItems(loading ? [] : tickets.map(t => t.ticket_id), 'queue');

  const fetchTickets = async () => {
    try {
      setLoading(true);
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
    }, 220);
    return () => clearTimeout(handler);
  }, [search]);

  // Subscribe to real-time events via SSE
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
        setRealtimeNotification(`New incoming ticket from ${updatedTicket.author_name} (AI Priority: ${updatedTicket.priority})`);
      } else if (eventType === 'new_message') {
        setRealtimeNotification(`New author message on ticket ${updatedTicket.ticket_id}`);
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

  // Counts
  const totalCritical = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const totalHigh = tickets.filter(t => t.priority === 'High' && t.status !== 'Resolved' && t.status !== 'Closed').length;
  const totalUnresolved = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
  const totalResolved = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Filtered & Sorted tickets
  const displayedTickets = useMemo(() => {
    let list = tickets.filter(ticket => {
      if (activeTab === 'unresolved') return ticket.status === 'Open' || ticket.status === 'In Progress';
      if (activeTab === 'critical') return ticket.priority === 'Critical' && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
      if (activeTab === 'high') return ticket.priority === 'High' && ticket.status !== 'Resolved' && ticket.status !== 'Closed';
      if (activeTab === 'resolved') return ticket.status === 'Resolved' || ticket.status === 'Closed';
      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortBy === 'sla') {
        // Priority weight: Critical (4) > High (3) > Medium (2) > Low (1)
        const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        const wDiff = (weight[b.priority] || 0) - (weight[a.priority] || 0);
        if (wDiff !== 0) return wDiff;
        // Oldest created first for unresolved SLA
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'priority') {
        const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      return 0;
    });
  }, [tickets, activeTab, sortBy]);

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || search || activeTab !== 'all';

  const resetAllFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setPriorityFilter('all');
    setSearch('');
    setActiveTab('all');
  };

  return (
    <div>
      {/* Real-time SSE Notification Banner */}
      <AnimatePresence>
        {realtimeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={tBase}
            style={{
              background: 'var(--brand-700)',
              color: 'white',
              padding: '0.65rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.84rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block' }} />
              <span>{realtimeNotification}</span>
            </div>
            <button
              onClick={() => setRealtimeNotification(null)}
              style={{ background: 'transparent', border: 'none', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', padding: 2 }}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Operations Triage Queue</h1>
            <p className="page-subtitle">
              High-density author issue management. Incoming tickets are AI-classified and matched against BookLeaf knowledge base policies for rapid resolution.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchTickets}
            title="Refresh queue"
            style={{ gap: '0.45rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Triage Strip (Linear-Style Segmented Control, Replaces Generic 4 Cards) */}
      <div className="triage-strip">
        <div className="triage-tabs">
          <button
            className={`triage-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>All Tickets</span>
            <span className="triage-count">{tickets.length}</span>
          </button>

          <button
            className={`triage-tab ${activeTab === 'unresolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('unresolved')}
          >
            <Clock size={12} style={{ color: 'var(--status-progress-text)' }} />
            <span>Needs Attention</span>
            <span className="triage-count">{totalUnresolved}</span>
          </button>

          <button
            className={`triage-tab ${activeTab === 'critical' ? 'active' : ''}`}
            onClick={() => setActiveTab('critical')}
          >
            <Flame size={12} style={{ color: 'var(--priority-critical-text)' }} />
            <span>Critical Blockers</span>
            <span className={`triage-count ${totalCritical > 0 ? 'critical' : ''}`}>{totalCritical}</span>
          </button>

          <button
            className={`triage-tab ${activeTab === 'high' ? 'active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            <AlertTriangle size={12} style={{ color: 'var(--priority-high-text)' }} />
            <span>High Priority</span>
            <span className={`triage-count ${totalHigh > 0 ? 'high' : ''}`}>{totalHigh}</span>
          </button>

          <button
            className={`triage-tab ${activeTab === 'resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('resolved')}
          >
            <CheckCircle2 size={12} style={{ color: 'var(--status-resolved-text)' }} />
            <span>Resolved</span>
            <span className="triage-count">{totalResolved}</span>
          </button>
        </div>

        <div className="ai-coverage-chip">
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-600)', display: 'inline-block' }} />
          <span>AI Auto-Triage Active · 100% Coverage</span>
        </div>
      </div>

      {/* Linear-Style Search & Filters Bar */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.65rem 0.85rem',
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.65rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
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
            placeholder="Filter ticket ID, author, book title, or issue..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.1rem', fontSize: '0.82rem', height: '34px' }}
          />
          {search && (
            <button aria-label="Clear search"
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '0.6rem',
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

        {/* Filter Selects */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="form-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 120, fontSize: '0.78rem', height: '34px', padding: '0 1.75rem 0 0.65rem' }}
          >
            <option value="all">Status: All</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            className="form-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 120, fontSize: '0.78rem', height: '34px', padding: '0 1.75rem 0 0.65rem' }}
          >
            <option value="all">Priority: All</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            className="form-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 150, fontSize: '0.78rem', height: '34px', padding: '0 1.75rem 0 0.65rem' }}
          >
            <option value="all">Category: All</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <select
              className="form-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              style={{ width: 'auto', minWidth: 140, fontSize: '0.78rem', height: '34px', padding: '0 1.75rem 0 0.65rem' }}
              title="Change queue sort order"
            >
              <option value="sla">Sort: SLA Urgency</option>
              <option value="newest">Sort: Most Recent</option>
              <option value="priority">Sort: Priority Only</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={resetAllFilters}
              style={{ fontSize: '0.76rem', color: 'var(--accent-rose)', padding: '0.2rem 0.5rem' }}
            >
              <X size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* High-Density Triage Table */}
      <div className="table-container">
        {displayedTickets.length === 0 ? (
          <div className="m-fade" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
            <div className="empty-state-icon-pop" style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <TicketIcon size={18} />
            </div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: 'var(--text-highlight)' }}>
              No matching tickets found
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 1.25rem' }}>
              No tickets matched the current filter criteria. Try clearing search filters or selecting a different status tab.
            </p>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={resetAllFilters}>
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '95px' }}>Priority</th>
                <th style={{ width: '105px' }}>Status</th>
                <th>Query Details</th>
                <th style={{ width: '190px' }}>Author</th>
                <th style={{ width: '170px' }}>Category</th>
                <th style={{ width: '120px' }}>Logged</th>
                <th style={{ width: '85px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody key={`${activeTab}|${statusFilter}|${categoryFilter}|${priorityFilter}|${sortBy}`} className="m-swap">
              {displayedTickets.map(ticket => {
                const authorInitial = ticket.author_name ? ticket.author_name[0].toUpperCase() : 'A';
                const createdDate = new Date(ticket.created_at);
                const isCritical = ticket.priority === 'Critical' && ticket.status !== 'Resolved' && ticket.status !== 'Closed';

                return (
                  <tr
                    key={ticket.ticket_id}
                    className={freshTickets.has(ticket.ticket_id) ? 'm-flash' : undefined}
                    onClick={() => onSelectTicket(ticket.ticket_id)}
                    style={{
                      cursor: 'pointer',
                      background: isCritical ? 'rgba(254, 242, 242, 0.45)' : undefined
                    }}
                  >
                    <td>
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--brand-700)',
                              background: 'var(--brand-50)',
                              padding: '1px 5px',
                              borderRadius: 'var(--radius-xs)',
                              border: '1px solid rgba(27, 67, 50, 0.2)'
                            }}
                          >
                            {ticket.ticket_id}
                          </span>
                          <strong style={{ color: 'var(--text-highlight)', fontSize: '0.86rem' }}>
                            {ticket.subject}
                          </strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {ticket.book_title && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }}>
                              <BookOpen size={12} className="icon-brand" />
                              <em>{ticket.book_title}</em>
                            </span>
                          )}
                          <span>·</span>
                          <span>{ticket.messages.length} {ticket.messages.length === 1 ? 'msg' : 'msgs'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            flexShrink: 0
                          }}
                        >
                          {authorInitial}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ticket.author_name}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ticket.author_email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-category" style={{ fontSize: '0.68rem' }}>
                        {ticket.category}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }} className="tabular-nums">
                        <div>{createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          {createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {(ticket.status === 'Open' || ticket.status === 'In Progress') && (() => {
                          const hrs = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / 3600000));
                          const stale = hrs >= 48;
                          return (
                            <div style={{ fontSize: '0.68rem', fontWeight: stale ? 650 : 400, color: stale ? 'var(--priority-critical-text)' : 'var(--text-muted)' }}>
                              {stale ? `Unresolved ${Math.floor(hrs / 24)}d` : hrs >= 1 ? `Open ${hrs}h` : 'Just now'}
                            </div>
                          );
                        })()}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket.ticket_id);
                        }}
                        style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', gap: '0.25rem' }}
                      >
                        <span>Triage</span>
                        <ChevronRight size={16} className="btn-arrow-icon" />
                      </button>
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
