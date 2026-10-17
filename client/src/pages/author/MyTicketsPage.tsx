import React, { useEffect, useState } from 'react';
import { Ticket } from '../../types';
import { api } from '../../services/api';
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
  Sparkles,
  ChevronDown,
  ChevronUp
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

  const loadTickets = async () => {
    try {
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
    const unsubscribe = subscribeToTickets((updatedTicket, eventType) => {
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
      setTimeout(() => setRealtimeFlashId(null), 4000);
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
        prev.map(t => (t.ticket_id === res.data.ticket_id ? res.data : t))
      );
      setReplyMessage('');
    } catch (err: any) {
      alert(err.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const selectedTicket = tickets.find(t => t.ticket_id === selectedTicketId);

  const filteredTickets = tickets.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status.toLowerCase() === filterStatus.toLowerCase();
  });

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading support queries...</div>;
  }

  return (
    <div>
      {/* Page Title & Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>My Support Tickets</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Live communication with the BookLeaf Editorial, Royalty & Production desks.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenNewTicketModal}>
          + Raise New Ticket
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {['all', 'open', 'in progress', 'resolved', 'closed'].map(st => (
          <button
            key={st}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(st)}
            style={{ textTransform: 'capitalize' }}
          >
            {st} {st !== 'all' && `(${tickets.filter(t => t.status.toLowerCase() === st).length})`}
          </button>
        ))}
      </div>

      {filteredTickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <TicketIcon size={48} style={{ color: '#64748b', margin: '0 auto 1rem' }} />
          <h3>No tickets found</h3>
          <p style={{ color: '#94a3b8', maxWidth: '420px', margin: '0.5rem auto 1.5rem' }}>
            Have a question about your book royalties, print quality, ISBN, or Amazon listing? Our team is here to assist.
          </p>
          <button className="btn btn-primary" onClick={onOpenNewTicketModal}>
            Raise Support Ticket
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
          {/* Left Column: Ticket List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTickets.map(ticket => {
              const isSelected = ticket.ticket_id === selectedTicketId;
              const isFlashed = ticket.ticket_id === realtimeFlashId;

              return (
                <div
                  key={ticket.ticket_id}
                  className="card"
                  onClick={() => setSelectedTicketId(ticket.ticket_id)}
                  style={{
                    cursor: 'pointer',
                    padding: '1.15rem',
                    borderColor: isSelected
                      ? 'var(--brand-light)'
                      : isFlashed
                      ? '#34d399'
                      : undefined,
                    background: isSelected
                      ? 'rgba(20, 184, 166, 0.08)'
                      : undefined,
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  {isFlashed && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '12px',
                        background: '#10b981',
                        color: 'white',
                        fontSize: '0.65rem',
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
                      }}
                    >
                      ⚡ Live Update
                    </span>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94a3b8' }}>
                      {ticket.ticket_id}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>

                  <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.4rem 0', color: '#f8fafc' }}>
                    {ticket.subject}
                  </h4>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span className="badge badge-category" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      {ticket.category}
                    </span>
                    {ticket.book_title && (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        📖 {ticket.book_title}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                    <span>{ticket.messages.length} {ticket.messages.length === 1 ? 'message' : 'messages'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Two Columns: Ticket Conversation Thread */}
          {selectedTicket ? (
            <div className="card" style={{ gridColumn: 'span 2', padding: '1.5rem' }}>
              {/* Ticket Header */}
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <StatusBadge status={selectedTicket.status} />
                    <span className="badge badge-category">{selectedTicket.category}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                    {selectedTicket.ticket_id}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.35rem', marginBottom: '0.5rem' }}>{selectedTicket.subject}</h3>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Related Book: <strong style={{ color: '#cbd5e1' }}>{selectedTicket.book_title || 'General / Account Level'}</strong></span>
                  <span>Submitted: <strong style={{ color: '#cbd5e1' }}>{new Date(selectedTicket.created_at).toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Attachment if present */}
              {selectedTicket.attachment_name && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.6rem 0.9rem',
                    borderRadius: '8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.82rem',
                    color: '#2dd4bf',
                    marginBottom: '1.25rem'
                  }}
                >
                  <Paperclip size={14} />
                  <span>Attachment: <strong>{selectedTicket.attachment_name}</strong></span>
                </div>
              )}

              {/* Message Thread */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {selectedTicket.messages.map((msg, index) => {
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.message_id || index}
                      style={{
                        alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                        maxWidth: '85%',
                        background: isAdmin
                          ? 'rgba(15, 23, 42, 0.9)'
                          : 'rgba(13, 148, 136, 0.15)',
                        border: isAdmin
                          ? '1px solid rgba(56, 189, 248, 0.3)'
                          : '1px solid rgba(20, 184, 166, 0.3)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isAdmin ? '#38bdf8' : '#2dd4bf' }}>
                          {isAdmin ? `🛡️ BookLeaf Support Team (${msg.sender_name})` : `👤 You (${msg.sender_name})`}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} style={{ marginTop: '1rem' }}>
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Reply to BookLeaf Support Team
                  </label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Type your reply or additional questions here..."
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSendingReply || !replyMessage.trim()}
                  >
                    <Send size={14} />
                    {isSendingReply ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: '#94a3b8' }}>Select a ticket from the left column to view the message history.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
