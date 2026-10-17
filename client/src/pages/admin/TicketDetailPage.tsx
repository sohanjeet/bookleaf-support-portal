import React, { useEffect, useState } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, Book } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { AIDraftBox } from '../../components/AIDraftBox';
import {
  ArrowLeft,
  User as UserIcon,
  BookOpen,
  Sparkles,
  Lock,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Tag,
  Shield,
  Clock
} from 'lucide-react';

interface Props {
  ticketId: string;
  onBack: () => void;
}

export const TicketDetailPage: React.FC<Props> = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  const { subscribeToTickets } = useRealtime();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalNote, setInternalNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      const res = await api.getTicketById(ticketId);
      setTicket(res.data);
      if (res.data.book_id) {
        api.getBookById(res.data.book_id)
          .then(bRes => setBookDetails(bRes.data))
          .catch(() => setBookDetails(null));
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    // Listen for real-time updates via SSE
    const unsubscribe = subscribeToTickets((updatedTicket) => {
      if (updatedTicket.ticket_id === ticketId) {
        setTicket(updatedTicket);
      }
    });

    return () => unsubscribe();
  }, [ticketId, subscribeToTickets]);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      setIsUpdatingMeta(true);
      const res = await api.updateTicket(ticket.ticket_id, { status: newStatus });
      setTicket(res.data);
      showNotice(`Status updated to "${newStatus}"`);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handleCategoryOverride = async (newCategory: TicketCategory) => {
    if (!ticket) return;
    try {
      setIsUpdatingMeta(true);
      const res = await api.updateTicket(ticket.ticket_id, { category: newCategory });
      setTicket(res.data);
      showNotice(`Category overridden to "${newCategory}"`);
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handlePriorityOverride = async (newPriority: TicketPriority) => {
    if (!ticket) return;
    try {
      setIsUpdatingMeta(true);
      const res = await api.updateTicket(ticket.ticket_id, { priority: newPriority });
      setTicket(res.data);
      showNotice(`Priority overridden to "${newPriority}"`);
    } catch (err: any) {
      alert(err.message || 'Failed to update priority');
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket || !user) return;
    try {
      setIsUpdatingMeta(true);
      const res = await api.updateTicket(ticket.ticket_id, {
        assigned_to: user.id,
        assigned_to_name: user.name
      });
      setTicket(res.data);
      showNotice(`Ticket assigned to ${user.name}`);
    } catch (err: any) {
      alert(err.message || 'Failed to assign ticket');
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim() || !ticket) return;

    try {
      setIsSubmittingNote(true);
      const res = await api.addInternalNote(ticket.ticket_id, internalNote.trim());
      setTicket(res.data);
      setInternalNote('');
      showNotice('Internal note saved.');
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const showNotice = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading || !ticket) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading ticket details...</div>;
  }

  const categories: TicketCategory[] = [
    'Royalty & Payments',
    'ISBN & Metadata Issues',
    'Printing & Quality',
    'Distribution & Availability',
    'Book Status & Production Updates',
    'General Inquiry'
  ];

  const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

  return (
    <div>
      {/* Top Navigation & Status Notice */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to Ticket Queue
        </button>

        {successMessage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#34d399', fontSize: '0.82rem', fontWeight: 600 }}>
            <CheckCircle size={15} />
            {successMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        {/* Main 2 Columns: Ticket details, Conversation & AI Draft */}
        <div style={{ gridColumn: 'span 2' }}>
          {/* Header Card */}
          <div className="card mb-4" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: '#94a3b8', fontWeight: 700 }}>
                    {ticket.ticket_id}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="badge badge-category">{ticket.category}</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{ticket.subject}</h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem', color: '#94a3b8', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <span>Author: <strong style={{ color: '#f8fafc' }}>{ticket.author_name}</strong> ({ticket.author_id})</span>
              <span>Submitted: <strong style={{ color: '#cbd5e1' }}>{new Date(ticket.created_at).toLocaleString()}</strong></span>
              <span>Assignee: <strong style={{ color: ticket.assigned_to_name ? '#2dd4bf' : '#fbbf24' }}>{ticket.assigned_to_name || 'Unassigned'}</strong></span>
            </div>

            {ticket.attachment_name && (
              <div
                style={{
                  marginTop: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#2dd4bf'
                }}
              >
                <Paperclip size={14} />
                <span>Attachment: <strong>{ticket.attachment_name}</strong></span>
              </div>
            )}
          </div>

          {/* Conversation History */}
          <div className="card mb-4">
            <div className="card-header">
              <div className="card-title">
                <MessageSquare size={18} className="text-brand" />
                Customer Communication Thread ({ticket.messages.length})
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {ticket.messages.map((m, idx) => {
                const isAdmin = m.sender_role === 'admin';
                return (
                  <div
                    key={m.message_id || idx}
                    style={{
                      background: isAdmin ? 'rgba(15, 23, 42, 0.9)' : 'rgba(20, 184, 166, 0.08)',
                      border: isAdmin ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(20, 184, 166, 0.2)',
                      borderRadius: '10px',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: isAdmin ? '#38bdf8' : '#2dd4bf' }}>
                        {isAdmin ? `🛡️ ${m.sender_name} (BookLeaf Ops)` : `👤 ${m.sender_name} (Author)`}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {new Date(m.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#f8fafc', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI-Drafted Response Box */}
            <AIDraftBox
              ticket={ticket}
              onResponseSent={updated => setTicket(updated)}
            />
          </div>

          {/* Internal Notes (Admin-Only Section) */}
          <div
            className="card"
            style={{
              background: 'rgba(30, 27, 75, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.3)'
            }}
          >
            <div className="card-header">
              <div className="card-title" style={{ color: '#c084fc' }}>
                <Lock size={16} />
                Internal Team Notes (Strictly Confidential — Hidden from Author)
              </div>
            </div>

            {ticket.internal_notes.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 1rem' }}>
                No internal notes yet. Use this section to log team investigations, Finance checks, or printer escalations.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {ticket.internal_notes.map((note, i) => (
                  <div
                    key={note.note_id || i}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#c084fc', marginBottom: '0.25rem' }}>
                      <strong>{note.admin_name}</strong>
                      <span style={{ color: '#64748b' }}>{new Date(note.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{note.note}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddInternalNote}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Add private note for the operations team (e.g., 'Checked with Repro Delhi warehouse, reprint queued')..."
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={isSubmittingNote || !internalNote.trim()}
              >
                <Lock size={13} />
                {isSubmittingNote ? 'Saving Note...' : 'Add Private Note'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Triage Panel, Overrides, & Author/Book Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI Intelligence & Overrides Panel */}
          <div className="card" style={{ border: '1px solid rgba(56, 189, 248, 0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div className="brand-icon-box" style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #0284c7, #38bdf8)' }}>
                <Sparkles size={15} />
              </div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>AI Triage & Overrides</h4>
            </div>

            {/* Status Switcher */}
            <div className="form-group">
              <label className="form-label">Ticket Status</label>
              <select
                className="form-select"
                value={ticket.status}
                onChange={e => handleStatusChange(e.target.value as TicketStatus)}
                disabled={isUpdatingMeta}
              >
                {statuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* AI Auto-Classification & Override */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Category Classification</label>
                {ticket.category_overridden ? (
                  <span className="badge" style={{ fontSize: '0.68rem', color: '#fb923c', background: 'rgba(251, 146, 60, 0.15)' }}>
                    Admin Overridden
                  </span>
                ) : (
                  <span className="badge badge-ai" style={{ fontSize: '0.68rem' }}>
                    AI Classified
                  </span>
                )}
              </div>
              <select
                className="form-select"
                value={ticket.category}
                onChange={e => handleCategoryOverride(e.target.value as TicketCategory)}
                disabled={isUpdatingMeta}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* AI Priority Scoring & Override */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Priority Score</label>
                {ticket.priority_overridden ? (
                  <span className="badge" style={{ fontSize: '0.68rem', color: '#fb923c', background: 'rgba(251, 146, 60, 0.15)' }}>
                    Admin Overridden
                  </span>
                ) : (
                  <span className="badge badge-ai" style={{ fontSize: '0.68rem' }}>
                    AI Scored
                  </span>
                )}
              </div>
              <select
                className="form-select"
                value={ticket.priority}
                onChange={e => handlePriorityOverride(e.target.value as TicketPriority)}
                disabled={isUpdatingMeta}
              >
                {priorities.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              {ticket.ai_priority_reasoning && (
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.35rem', fontStyle: 'italic' }}>
                  AI Reasoning: "{ticket.ai_priority_reasoning}"
                </div>
              )}
            </div>

            {/* Ticket Assignment */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assigned Specialist</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-control"
                  value={ticket.assigned_to_name || 'Unassigned'}
                  readOnly
                  style={{ fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAssignToMe}
                  disabled={isUpdatingMeta || ticket.assigned_to === user?.id}
                >
                  Assign to Me
                </button>
              </div>
            </div>
          </div>

          {/* Book Context Card (If linked) */}
          {bookDetails && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <BookOpen size={16} className="text-brand" />
                <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Linked Book Record</h4>
              </div>

              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong style={{ color: '#f8fafc', fontSize: '0.9rem' }}>{bookDetails.title}</strong>
                  <div style={{ color: '#94a3b8', fontFamily: 'monospace' }}>ISBN: {bookDetails.isbn}</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.4rem' }}>
                  <span style={{ color: '#94a3b8' }}>Status:</span>
                  <strong>{bookDetails.status}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Copies Sold:</span>
                  <strong>{bookDetails.total_copies_sold.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Royalty Pending:</span>
                  <strong style={{ color: '#fbbf24' }}>₹{bookDetails.royalty_pending.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Print Partner:</span>
                  <span>{bookDetails.print_partner || 'In-House'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Author Profile Quick Reference */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <UserIcon size={16} className="text-brand" />
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Author Overview</h4>
            </div>

            <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>
                <strong style={{ color: '#f8fafc' }}>{ticket.author_name}</strong>
                <div style={{ color: '#94a3b8' }}>{ticket.author_email}</div>
              </div>
              <div style={{ color: '#64748b' }}>Author ID: {ticket.author_id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
