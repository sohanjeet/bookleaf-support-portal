import React, { useEffect, useState } from 'react';
import { Ticket, TicketStatus, TicketCategory, TicketPriority, Book } from '../../types';
import { api, openAttachment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../context/RealtimeContext';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { useFreshItems } from '../../useFreshItems';
import { AIDraftBox } from '../../components/AIDraftBox';
import {
  ArrowLeft,
  User as UserIcon,
  BookOpen,
  WandSparkles,
  Lock,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle,
  Paperclip,
  Tag,
  Shield,
  Clock,
  UserCheck
} from 'lucide-react';

interface Props {
  ticketId: string;
  onBack: () => void;
}

export const TicketDetailPage: React.FC<Props> = ({ ticketId, onBack }) => {
  const { user } = useAuth();
  const { subscribeToTickets } = useRealtime();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const freshMessages = useFreshItems((ticket?.messages ?? []).map((m, i) => String(m.message_id || i)), ticketId);
  const freshNotes = useFreshItems((ticket?.internal_notes ?? []).map((n, i) => String(n.note_id || i)), ticketId);
  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalNote, setInternalNote] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchTicket = async () => {
    try {
      setLoading(true);
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
      alert(err.message || 'Failed to add internal note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const showNotice = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const statuses: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
  const categories: TicketCategory[] = [
    'Royalty & Payments',
    'ISBN & Metadata Issues',
    'Printing & Quality',
    'Distribution & Availability',
    'Book Status & Production Updates',
    'General Inquiry'
  ];
  const priorities: TicketPriority[] = ['Critical', 'High', 'Medium', 'Low'];

  if (loading && !ticket) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }} role="status">
        Loading ticket details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-rose)' }}>Ticket not found or has been deleted.</p>
        <button className="btn btn-secondary mt-4" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation & Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ marginBottom: '0.75rem', gap: '0.4rem', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Triage Queue</span>
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--brand-700)',
                  background: 'var(--brand-50)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid rgba(45, 106, 79, 0.25)'
                }}
              >
                {ticket.ticket_id}
              </span>
              <PriorityBadge priority={ticket.priority} />
              <StatusBadge status={ticket.status} />
              <span className="badge badge-category">{ticket.category}</span>
            </div>

            <h1 className="page-title" style={{ fontSize: 'clamp(1.5rem, 1.25rem + 0.7vw, 1.875rem)', margin: 0 }}>
              {ticket.subject}
            </h1>

            {ticket.attachment_name && (
              <div
                style={{
                  marginTop: '0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  padding: '0.35rem 0.7rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <Paperclip size={14} className="icon-brand" />
                <span>
                  Author Attachment:{' '}
                  {ticket.attachment_url && ticket.attachment_url.startsWith('/uploads/') ? (
                    <a
                      href={ticket.attachment_url}
                      onClick={(e) => { e.preventDefault(); openAttachment(ticket.attachment_url!).catch(() => window.alert('Attachment could not be opened.')); }}
                      style={{ fontWeight: 600 }}
                    >{ticket.attachment_name}</a>
                  ) : (
                    <strong style={{ color: 'var(--text-highlight)' }}>{ticket.attachment_name}</strong>
                  )}
                </span>
              </div>
            )}
          </div>

          {successMessage && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--status-resolved-bg)',
                border: '1px solid var(--status-resolved-border)',
                color: 'var(--status-resolved-text)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                fontWeight: 500,
                animation: 'm-rise var(--dur-base) var(--ease-out) backwards'
              }}
            >
              <CheckCircle size={16} />
              <span>{successMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Editorial Grid */}
      <div className="stack-on-tablet" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Messages Thread, AI Draft, Internal Notes */}
        <div>
          {/* Conversation History */}
          <div className="card mb-6" style={{ padding: '1.5rem' }}>
            <div className="card-header" style={{ marginBottom: '1.25rem' }}>
              <div className="card-title">
                <MessageSquare size={16} className="icon-brand" />
                <span>Conversation Timeline</span>
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {ticket.messages.length} {ticket.messages.length === 1 ? 'Message' : 'Messages'} · Live SSE Connected
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {ticket.messages.map((m, i) => {
                const isAuthor = m.sender_role === 'author';
                const msgTime = new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                const msgDate = new Date(m.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

                return (
                  <div
                    key={m.message_id || i}
                    className={freshMessages.has(String(m.message_id || i)) ? 'm-enter' : undefined}
                    style={{
                      background: isAuthor ? 'var(--bg-primary)' : '#F2F8F5',
                      border: isAuthor ? '1px solid var(--border-default)' : '1px solid rgba(45, 106, 79, 0.25)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.15rem 1.25rem',
                      boxShadow: 'var(--shadow-xs)',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: isAuthor ? 'var(--bg-secondary)' : 'var(--brand-600)',
                            color: isAuthor ? 'var(--text-primary)' : 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 600
                          }}
                        >
                          {m.sender_name ? m.sender_name[0].toUpperCase() : 'U'}
                        </div>
                        <strong style={{ fontSize: '0.84rem', color: 'var(--text-highlight)' }}>
                          {m.sender_name}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)',
                            background: isAuthor ? 'var(--bg-secondary)' : 'rgba(45, 106, 79, 0.12)',
                            color: isAuthor ? 'var(--text-secondary)' : 'var(--brand-700)',
                            fontWeight: 600
                          }}
                        >
                          {isAuthor ? 'Author' : 'Operations Desk'}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {msgDate} at {msgTime}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>
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
              background: '#FFFDF9',
              border: '1px solid #EFE8DC',
              padding: '1.25rem'
            }}
          >
            <div className="card-header" style={{ borderBottomColor: '#EFE8DC' }}>
              <div className="card-title" style={{ color: '#92400E' }}>
                <Lock size={16} />
                <span>Internal Team Notes</span>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Confidential — Hidden from Author</span>
            </div>

            {ticket.internal_notes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0 0 1rem' }}>
                No internal notes yet. Log team investigations, Finance checks, or printer escalations here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1rem' }}>
                {ticket.internal_notes.map((note, i) => (
                  <div
                    key={note.note_id || i}
                    className={freshNotes.has(String(note.note_id || i)) ? 'm-enter' : undefined}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #EFE8DC',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem 0.95rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.73rem', color: '#92400E', marginBottom: '0.2rem' }}>
                      <strong>{note.admin_name}</strong>
                      <span style={{ color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(note.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>{note.note}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddInternalNote}>
              <div className="form-group" style={{ marginBottom: '0.65rem' }}>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Add private note for operations team..."
                  value={internalNote}
                  onChange={e => setInternalNote(e.target.value)}
                  style={{ background: '#FFFFFF', borderColor: '#EFE8DC', fontSize: '0.82rem' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={isSubmittingNote || !internalNote.trim()}
                style={{ gap: '0.35rem' }}
              >
                <Lock size={12} />
                <span>{isSubmittingNote ? 'Saving...' : 'Add Private Note'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: AI Triage Panel, Overrides, & Author/Book Context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* AI Intelligence & Overrides Panel */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.15rem' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--brand-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <WandSparkles size={16} />
              </div>
              <h4 style={{ margin: 0, fontSize: '0.92rem' }}>AI Triage & Overrides</h4>
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
                <label className="form-label" style={{ margin: 0 }}>Category</label>
                {ticket.category_overridden ? (
                  <span className="badge" style={{ fontSize: '0.65rem', color: 'var(--priority-high-text)', background: 'var(--priority-high-bg)', borderColor: 'var(--priority-high-border)' }}>
                    Overridden
                  </span>
                ) : (
                  <span className="badge badge-ai">
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
                <label className="form-label" style={{ margin: 0 }}>Priority</label>
                {ticket.priority_overridden ? (
                  <span className="badge" style={{ fontSize: '0.65rem', color: 'var(--priority-high-text)', background: 'var(--priority-high-bg)', borderColor: 'var(--priority-high-border)' }}>
                    Overridden
                  </span>
                ) : (
                  <span className="badge badge-ai">
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
            </div>

            {/* Assignee */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assignee</label>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ticket.assigned_to_name || 'Unassigned'}
                </span>
                {(!ticket.assigned_to || ticket.assigned_to !== user?.id) && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleAssignToMe}
                    disabled={isUpdatingMeta}
                    style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                  >
                    <UserCheck size={16} />
                    Assign to Me
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Author Details Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <div className="card-title">
                <UserIcon size={16} className="icon-brand" />
                <span>Author Profile</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
                {ticket.author_id}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.82rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Author Name</div>
                <strong style={{ color: 'var(--text-highlight)' }}>{ticket.author_name}</strong>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ color: 'var(--text-secondary)' }}>{ticket.author_email}</div>
              </div>
            </div>
          </div>

          {/* Linked Book Details */}
          {bookDetails && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="card-header">
                <div className="card-title">
                  <BookOpen size={16} className="icon-brand" />
                  <span>Linked Manuscript</span>
                </div>
                <span className="badge badge-resolved" style={{ fontSize: '0.65rem' }}>
                  {bookDetails.status}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 44,
                    height: 60,
                    borderRadius: 3,
                    background: 'var(--brand-800)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                  }}
                >
                  📖
                </div>
                <div style={{ minWidth: 0, fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-highlight)', marginBottom: '0.2rem' }}>
                    {bookDetails.title}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    ISBN: {bookDetails.isbn}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {bookDetails.total_copies_sold} copies sold · MRP ₹{bookDetails.mrp || '—'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
