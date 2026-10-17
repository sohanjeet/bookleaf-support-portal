import React, { useEffect, useState } from 'react';
import { Ticket } from '../../types';
import { api } from '../../services/api';
import { useFreshItems } from '../../useFreshItems';
import { useRealtime } from '../../context/RealtimeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  Ticket as TicketIcon,
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Clock,

  Shield,
  User,
  PlusCircle,
  Radio,
  FileText,
  BookOpen,

} from 'lucide-react';

interface Props {
  onOpenNewTicketModal: () => void;
}

export const MyTicketsPage: React.FC<Props> = ({ onOpenNewTicketModal }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [realtimeFlashId, setRealtimeFlashId] = useState<string | null>(null);

  const { subscribeToTickets } = useRealtime();
  const freshTickets = useFreshItems(loading ? [] : tickets.map(t => t.ticket_id), 'list');
  const freshMessages = useFreshItems((tickets.find(t => t.ticket_id === selectedTicketId)?.messages ?? []).map((m, i) => String(m.message_id || i)), selectedTicketId ?? '');

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await api.getTickets();
      setTickets(res.data);
      if (res.data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(res.data[0].ticket_id);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();

    // Subscribe to SSE real-time stream
    const unsubscribe = subscribeToTickets((updatedTicket) => {
      setTickets(prev => {
        const index = prev.findIndex(t => t.ticket_id === updatedTicket.ticket_id);
        if (index !== -1) {
          const next = [...prev];
          next[index] = updatedTicket;
          return next;
        } else {
          return [updatedTicket, ...prev];
        }
      });

      // Visual flash badge indicating live update received
      setRealtimeFlashId(updatedTicket.ticket_id);
      setTimeout(() => setRealtimeFlashId(null), 4500);
    });

    return () => unsubscribe();
  }, [subscribeToTickets]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicketId) return;

    try {
      setIsSendingReply(true);
      const res = await api.addMessage(selectedTicketId, replyMessage.trim());
      setTickets(prev =>
        prev.map(t => (t.ticket_id === selectedTicketId ? res.data : t))
      );
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit response.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const selectedTicket = tickets.find(t => t.ticket_id === selectedTicketId);

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div>
      {/* Top Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Author Support & Inquiries</h1>
            <p className="page-subtitle">
              Communicate with publishing coordinators regarding editing, print proofs, ISBNs, Amazon listings, and royalty payouts.
            </p>
          </div>

          <button className="btn btn-primary" onClick={onOpenNewTicketModal}>
            <PlusCircle size={16} />
            <span>Raise New Query</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: 'All Queries' },
          { key: 'open', label: 'Open' },
          { key: 'in progress', label: 'In Progress' },
          { key: 'resolved', label: 'Resolved' },
          { key: 'closed', label: 'Closed' }
        ].map(tab => {
          const count = tab.key === 'all'
            ? tickets.length
            : tickets.filter(t => t.status.toLowerCase() === tab.key).length;
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.78rem'
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-secondary)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  fontWeight: 600
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="card m-fade" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <TicketIcon size={28} className="empty-state-icon-pop" style={{ color: 'var(--text-muted)', margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.35rem', color: 'var(--text-highlight)' }}>
            No tickets found in this view
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem', fontSize: '0.84rem' }}>
            Have a question regarding royalty calculations, ISBN assignment, print proof quality, or retail listings?
          </p>
          <button className="btn btn-primary btn-sm" onClick={onOpenNewTicketModal}>
            <PlusCircle size={16} />
            <span>Raise Support Query</span>
          </button>
        </div>
      ) : (
        <div className="tickets-split" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 1.8fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Ticket List */}
          <div key={filterStatus} className="m-swap" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTickets.map(ticket => {
              const isSelected = ticket.ticket_id === selectedTicketId;
              const isFlashed = ticket.ticket_id === realtimeFlashId;

              return (
                <div
                  key={ticket.ticket_id}
                  className={`card card-interactive${freshTickets.has(ticket.ticket_id) ? ' m-enter' : ''}`}
                  onClick={() => setSelectedTicketId(ticket.ticket_id)}
                  style={{
                    cursor: 'pointer',
                    padding: '1rem',
                    border: isSelected
                      ? '1.5px solid var(--brand-600)'
                      : isFlashed
                      ? '1px solid var(--brand-400)'
                      : '1px solid var(--border-default)',
                    background: isSelected ? '#FFFFFF' : 'var(--bg-card)',
                    boxShadow: isSelected ? '0 4px 12px rgba(45, 106, 79, 0.08)' : 'var(--shadow-card)',
                    transition: 'border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease, background-color var(--dur-fast) ease',
                    position: 'relative'
                  }}
                >
                  {isFlashed && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '12px',
                        background: 'var(--brand-600)',
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 600,
                        boxShadow: '0 2px 6px rgba(45, 106, 79, 0.3)'
                      }}
                    >
                      <Radio size={12} style={{ display: 'inline', marginRight: 3, verticalAlign: 'middle' }} />
                      Live Update
                    </span>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--brand-700)' }}>
                      {ticket.ticket_id}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <h4 style={{ fontSize: '0.88rem', margin: '0 0 0.35rem 0', color: isSelected ? 'var(--brand-800)' : 'var(--text-highlight)', fontWeight: 600 }}>
                    {ticket.subject}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span className="badge badge-category" style={{ fontSize: '0.66rem' }}>
                      {ticket.category}
                    </span>
                    {ticket.book_title && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <BookOpen size={12} className="icon-brand" />
                        <em>{ticket.book_title}</em>
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span>{new Date(ticket.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <MessageSquare size={12} />
                      {ticket.messages.length} {ticket.messages.length === 1 ? 'msg' : 'msgs'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Ticket Conversation Thread */}
          {selectedTicket ? (
            <div key={selectedTicket.ticket_id} className="card m-swap" style={{ padding: '1.5rem' }}>
              {/* Ticket Header */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={selectedTicket.status} />
                    <span className="badge badge-category">{selectedTicket.category}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--brand-700)', fontFamily: 'var(--font-ui)', fontWeight: 600 }}>
                    {selectedTicket.ticket_id}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.4rem', fontWeight: 600, color: 'var(--text-highlight)' }}>
                  {selectedTicket.subject}
                </h2>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.76rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span>Related Title: <strong style={{ color: 'var(--text-secondary)' }}>{selectedTicket.book_title || 'General Account Inquiry'}</strong></span>
                  <span>Submitted: <strong style={{ color: 'var(--text-secondary)' }}>{new Date(selectedTicket.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></span>
                </div>
              </div>

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {selectedTicket.messages.map((msg, index) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.message_id || index}
                      className={freshMessages.has(String(msg.message_id || index)) ? 'm-enter' : undefined}
                      style={{
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isAdmin ? '#F2F8F5' : '#FFFFFF',
                        border: isAdmin ? '1px solid rgba(45, 106, 79, 0.25)' : '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem 1.15rem',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', gap: '1rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem', color: isAdmin ? 'var(--brand-700)' : 'var(--text-highlight)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {isAdmin ? <Shield size={14} /> : <User size={13} />}
                          {isAdmin ? `BookLeaf Operations (${msg.sender_name})` : `You (${msg.sender_name})`}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label">Add a Message to this Query</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Provide additional details or reply to the operations team..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    style={{ fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSendingReply || !replyMessage.trim()}
                    style={{ fontSize: '0.84rem' }}
                  >
                    <Send size={16} className="btn-arrow-icon" />
                    <span>{isSendingReply ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Select a query from the list to view conversation history.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
