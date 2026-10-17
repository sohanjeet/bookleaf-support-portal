import React, { useState } from 'react';
import { Book, Ticket } from '../types';
import { api } from '../services/api';
import { X, Send, Paperclip, Sparkles, Book as BookIcon } from 'lucide-react';

interface Props {
  books: Book[];
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (ticket: Ticket) => void;
}

export const NewTicketModal: React.FC<Props> = ({ books, isOpen, onClose, onTicketCreated }) => {
  const [bookId, setBookId] = useState<string>('general');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please provide both a subject and a detailed description.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const formData = new FormData();
      formData.append('book_id', bookId);
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());
      if (file) {
        formData.append('attachment', file);
        formData.append('attachment_name', file.name);
      }

      const res = await api.createTicket(formData);
      onTicketCreated(res.data);
      onClose();
      // Reset
      setSubject('');
      setDescription('');
      setFile(null);
      setBookId('general');
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div className="brand-icon-box" style={{ width: 32, height: 32 }}>
              <Sparkles size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Submit Author Support Query</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Powered by AI Auto-Classification & Intelligent Response Assistance
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid #f43f5e',
                  color: '#fecdd3',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}
              >
                {error}
              </div>
            )}

            {/* Select Book Dropdown */}
            <div className="form-group">
              <label className="form-label">
                <BookIcon size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Select Related Book (or General Account Query)
              </label>
              <select
                className="form-select"
                value={bookId}
                onChange={e => setBookId(e.target.value)}
              >
                <option value="general">General / Account Level Inquiry (No specific book)</option>
                {books.map(b => (
                  <option key={b.book_id} value={b.book_id}>
                    📖 {b.title} ({b.isbn}) — Status: {b.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Inquiring about Q3 royalty payout status or Print defect in author copies"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Please describe your query with as much detail as possible (e.g., dates, platform links, copy count, or specific error observed)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* File Attachment Dropzone / Input */}
            <div className="form-group">
              <label className="form-label">
                <Paperclip size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Optional File Attachment (Photo proof for print issues, royalty screenshot, etc.)
              </label>
              <div
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.4)',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#2dd4bf' }}>
                    <Paperclip size={16} />
                    <span style={{ fontWeight: 600 }}>{file.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', marginLeft: 8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                      Click or drag and drop photos, documents, or screenshots (Max 10MB)
                    </p>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      Tip: Photos of print misalignments or blurry copies enable free reprints.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div
              style={{
                background: 'rgba(20, 184, 166, 0.08)',
                border: '1px solid rgba(20, 184, 166, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.78rem',
                color: '#99f6e4'
              }}
            >
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>
                Our AI Support Assistant will automatically classify your query and route it to the appropriate BookLeaf specialist (Royalty, ISBN, Printing, or Distribution) within seconds.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span>Submitting & AI Classifying...</span>
              ) : (
                <>
                  <Send size={15} />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
