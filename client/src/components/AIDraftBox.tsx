import React, { useState, useEffect } from 'react';
import { Ticket } from '../types';
import { api } from '../services/api';
import {
  WandSparkles,
  Send,
  RefreshCw,
  CheckCircle,

  Edit3,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface Props {
  ticket: Ticket;
  onResponseSent: (updatedTicket: Ticket) => void;
}

export const AIDraftBox: React.FC<Props> = ({ ticket, onResponseSent }) => {
  const [draftText, setDraftText] = useState<string>(ticket.ai_draft_response || '');
  const [initialDraft, setInitialDraft] = useState<string>(ticket.ai_draft_response || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [customTone, setCustomTone] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // Bumped when a new draft is loaded so the editor cross-fades in. Typing does not bump it.
  const [draftVersion, setDraftVersion] = useState<number>(0);

  useEffect(() => {
    setDraftText(ticket.ai_draft_response || '');
    setInitialDraft(ticket.ai_draft_response || '');
    setDraftVersion(v => v + 1);
  }, [ticket.ai_draft_response]);

  const isEdited = draftText.trim() !== initialDraft.trim();

  // Knowledge Base calibration presets
  const presets = [
    { label: 'Empathetic & 48h Escalation', prompt: 'Emphasize strong empathy and give a clear 48-hour resolution timeline.' },
    { label: 'Explain 80/20 Net Profit', prompt: 'Explain the 80/20 net profit calculation: MRP minus print cost, Amazon commission, and shipping.' },
    { label: '100% Free Reprint Offer', prompt: 'Offer 100% free reprint for print defects, ask for 2-3 photos, and cite 5-7 business days turnaround.' },
    { label: 'Amazon 24-48h Re-Sync', prompt: 'Explain inventory sync glitch on Amazon and reassure that team initiated a re-sync live within 24-48 hours.' }
  ];

  const handleRegenerate = async (toneInstruction?: string) => {
    try {
      setIsGenerating(true);
      setErrorMessage(null);
      const instruction = toneInstruction || customTone || undefined;
      const res = await api.regenerateDraft(ticket.ticket_id, instruction);
      setDraftText(res.data.draft_response);
      setInitialDraft(res.data.draft_response);
      setDraftVersion(v => v + 1);
      setSuccessNotice('Draft calibrated against BookLeaf Knowledge Base policies.');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Draft generation unavailable. You can write your response manually.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendResponse = async () => {
    if (!draftText.trim()) {
      setErrorMessage('Please enter a response message before sending.');
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage(null);
      const res = await api.addMessage(ticket.ticket_id, draftText.trim());
      onResponseSent(res.data);
      setSuccessNotice('Response dispatched to author in real-time!');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to dispatch response.');
    } finally {
      setIsSending(false);
    }
  };

  const handleResetToInitial = () => {
    setDraftText(initialDraft);
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginTop: '1.5rem',
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      {/* Header with obvious Unsent AI Draft status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span
              key={isGenerating ? 'gen' : isEdited ? 'edit' : 'ai'}
              className="m-swap"
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.68rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '2px 7px',
                borderRadius: 'var(--radius-xs)',
                background: isGenerating ? 'var(--bg-secondary)' : isEdited ? 'var(--status-progress-bg)' : 'var(--brand-50)',
                color: isGenerating ? 'var(--text-muted)' : isEdited ? 'var(--accent-gold)' : 'var(--brand-700)',
                border: '1px solid currentColor'
              }}
            >
              {isGenerating
                ? 'Generating Draft…'
                : isEdited
                ? 'Edited Draft (Unsent)'
                : 'AI-Assisted Draft (Unsent)'}
            </span>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
            Trained on BookLeaf's 80/20 royalty model, 48h ISBN turnaround, and quality guarantee.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          {isEdited && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleResetToInitial}
              style={{ fontSize: '0.72rem', gap: '0.3rem', color: 'var(--text-muted)' }}
              title="Revert to initial AI suggestion"
            >
              <RotateCcw size={16} />
              <span>Revert Edits</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => handleRegenerate()}
            disabled={isGenerating}
            title="Calibrate draft using BookLeaf Knowledge Base policies"
            style={{ fontSize: '0.74rem', gap: '0.35rem' }}
          >
            <RefreshCw size={16} className={isGenerating ? 'animate-spin' : ''} />
            <span>{isGenerating ? 'Calibrating…' : 'Regenerate Draft'}</span>
          </button>
        </div>
      </div>

      {/* Tone refinement chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Calibrate Tone:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{
              fontSize: '0.68rem',
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-subtle)',
              gap: '0.25rem'
            }}
            onClick={() => handleRegenerate(p.prompt)}
            disabled={isGenerating}
          >
            <WandSparkles size={12} className="icon-brand" />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      {/* Editable Response Textarea */}
      <div key={draftVersion} className={draftVersion > 1 ? 'm-swap' : undefined} style={{ position: 'relative' }}>
        <textarea
          aria-busy={isGenerating}
          className="form-control"
          rows={6}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.86rem',
            lineHeight: 1.6,
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem',
            color: 'var(--text-primary)',
            opacity: isGenerating ? 0.55 : 1,
            transition: 'opacity var(--dur-base) ease'
          }}
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          placeholder="AI is preparing a contextual draft or write your custom response directly here..."
        />
      </div>

      {/* Feedback notices */}
      {successNotice && (
        <div
          className="m-enter"
          role="status"
          style={{
            marginTop: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--status-resolved-text)',
            fontSize: '0.78rem',
            fontWeight: 500,
            background: 'var(--status-resolved-bg)',
            border: '1px solid var(--status-resolved-border)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <CheckCircle size={16} className="icon-swap" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div
          className="m-enter"
          role="alert"
          style={{
            marginTop: '0.65rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--priority-critical-text)',
            fontSize: '0.78rem',
            fontWeight: 500,
            background: 'var(--priority-critical-bg)',
            border: '1px solid var(--priority-critical-border)',
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bottom Dispatch Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.65rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Dispatches directly to author timeline & automatically advances ticket to "In Progress".
        </span>

        <button
          className="btn btn-primary"
          onClick={handleSendResponse}
          disabled={isSending || !draftText.trim()}
          style={{ fontSize: '0.84rem', padding: '0.5rem 1.15rem', gap: '0.45rem' }}
        >
          <Send size={16} className="btn-arrow-icon" />
          <span>{isSending ? 'Sending response…' : 'Send Response to Author'}</span>
        </button>
      </div>
    </div>
  );
};
