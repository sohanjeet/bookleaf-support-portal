import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { overlayVariants, dialogVariants } from '../motion';
import { Book, Ticket } from '../types';
import { api } from '../services/api';
import { X, Send, Paperclip, WandSparkles, MessageSquarePlus, Book as BookIcon, CheckCircle2, UploadCloud, AlertCircle } from 'lucide-react';

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
      // Reset form
      setSubject('');
      setDescription('');
      setFile(null);
      setBookId('general');
    } catch (err: any) {
      setError(err.message || 'Failed to submit query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
    {isOpen && (
    <motion.div className="modal-overlay" onClick={onClose} variants={overlayVariants} initial="hidden" animate="show" exit="exit">
      <motion.div className="modal-dialog" role="dialog" aria-modal="true" aria-label="Raise a support query" variants={dialogVariants} onClick={e => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%', borderRadius: 'var(--radius-xl)' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-600)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(45, 106, 79, 0.25)'
              }}
            >
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600, color: 'var(--text-highlight)' }}>
                Raise Author Support Query
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                Auto-classified & priority-routed with BookLeaf AI Operations Engine
              </p>
            </div>
          </div>
          <button className="btn btn-secondary btn-icon" aria-label="Close dialog" onClick={onClose} style={{ width: 30, height: 30 }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {error && (
              <div
                style={{
                  background: 'var(--priority-critical-bg)',
                  border: '1px solid var(--priority-critical-border)',
                  color: 'var(--priority-critical-text)',
                  padding: '0.65rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Select Book Dropdown */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookIcon size={14} className="icon-brand" />
                <span>Select Related Book (or General Inquiry)</span>
              </label>
              <select
                className="form-select"
                value={bookId}
                onChange={e => setBookId(e.target.value)}
              >
                <option value="general">General / Account Level Inquiry (No specific title)</option>
                {books.map(b => (
                  <option key={b.book_id} value={b.book_id}>
                    {b.title} ({b.isbn || 'Pending ISBN'}) — {b.status}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Subject</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Inquiring about Q3 royalty disbursement or Print defect in author copies"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Detailed Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Please describe your query in detail (dates, platform links, copy count, or specific error observed)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            {/* File Attachment Dropzone / Input */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Paperclip size={14} className="icon-muted" />
                <span>Optional File Proof / Screenshot</span>
              </label>
              <div
                style={{
                  border: '1.5px dashed var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.15rem 1rem',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--duration-fast) ease'
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem', color: 'var(--brand-700)' }}>
                    <Paperclip size={16} />
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{file.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '2px 8px', fontSize: '0.7rem' }}
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
                    <UploadCloud size={24} style={{ color: 'var(--brand-600)', margin: '0 auto 0.35rem', display: 'block' }} />
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      Click to upload photos, invoice receipts, or PDF attachments
                    </p>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                      Max file size 10MB · PNG, JPG, PDF supported
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* AI Assistant Banner */}
            <div
              style={{
                background: '#F4FAF6',
                border: '1px solid rgba(45, 106, 79, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontSize: '0.78rem',
                color: 'var(--brand-800)'
              }}
            >
              <WandSparkles size={16} style={{ color: 'var(--brand-600)', flexShrink: 0 }} />
              <span>
                Our AI Support Assistant automatically classifies your query and prepares a draft for the BookLeaf operations specialist based on company knowledge base policies.
              </span>
            </div>
          </div>

          <div className="modal-footer" style={{ padding: '0.85rem 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <span>Submitting & AI Classifying...</span>
              ) : (
                <>
                  <Send size={16} className="btn-arrow-icon" />
                  <span>Submit Query</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
    )}
    </AnimatePresence>
  );
};
