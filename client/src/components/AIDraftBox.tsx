import React, { useState } from 'react';
import { Ticket } from '../types';
import { api } from '../services/api';
import { Sparkles, Send, RefreshCw, CheckCircle, Wand2 } from 'lucide-react';

interface Props {
  ticket: Ticket;
  onResponseSent: (updatedTicket: Ticket) => void;
}

export const AIDraftBox: React.FC<Props> = ({ ticket, onResponseSent }) => {
  const [draftText, setDraftText] = useState<string>(ticket.ai_draft_response || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [customTone, setCustomTone] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Quick tone calibration presets based on BookLeaf Knowledge Base guidelines
  const presets = [
    { label: 'Empathetic & 48h Escalation', prompt: 'Emphasize strong empathy and give a clear 48-hour resolution timeline.' },
    { label: 'Explain Net Profit Formula', prompt: 'Explain the 80/20 net profit calculation: MRP minus print cost, Amazon commission, and shipping.' },
    { label: '100% Free Reprint Offer', prompt: 'Offer 100% free reprint for print defects, ask for 2-3 photos, and cite 5-7 business days turnaround.' },
    { label: 'Amazon 24-48h Re-Sync', prompt: 'Explain inventory sync glitch on Amazon and reassure that team initiated a re-sync live within 24-48 hours.' }
  ];

  const handleRegenerate = async (toneInstruction?: string) => {
    try {
      setIsGenerating(true);
      const instruction = toneInstruction || customTone || undefined;
      const res = await api.regenerateDraft(ticket.ticket_id, instruction);
      setDraftText(res.data.draft_response);
      setSuccessNotice('Draft refreshed based on BookLeaf Knowledge Base!');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate AI draft.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendResponse = async () => {
    if (!draftText.trim()) {
      alert('Please enter a response before sending.');
      return;
    }

    try {
      setIsSending(true);
      const res = await api.addMessage(ticket.ticket_id, draftText.trim());
      onResponseSent(res.data);
      setSuccessNotice('Response dispatched to author in real-time!');
      setTimeout(() => setSuccessNotice(null), 3500);
    } catch (err: any) {
      alert(err.message || 'Failed to send response.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(13, 148, 136, 0.05) 100%)',
        border: '1px solid rgba(20, 184, 166, 0.35)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginTop: '1.5rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="brand-icon-box" style={{ width: 28, height: 28 }}>
            <Sparkles size={15} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', margin: 0, color: '#f8fafc' }}>
              AI-Drafted Response (BookLeaf Knowledge-Base Calibrated)
            </h4>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Auto-tailored to author's specific royalties, book status, and company tone guidelines.
            </span>
          </div>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => handleRegenerate()}
          disabled={isGenerating}
          title="Regenerate using BookLeaf Knowledge Base"
        >
          <RefreshCw size={14} className={isGenerating ? 'spin' : ''} />
          {isGenerating ? 'Drafting...' : 'Regenerate Draft'}
        </button>
      </div>

      {/* Tone refinement presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Quick Tone Calibration:</span>
        {presets.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '4px' }}
            onClick={() => handleRegenerate(p.prompt)}
            disabled={isGenerating}
          >
            <Wand2 size={11} style={{ marginRight: 3 }} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Editable Response Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          className="form-textarea"
          rows={7}
          style={{
            fontFamily: 'inherit',
            fontSize: '0.88rem',
            lineHeight: 1.55,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.12)'
          }}
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          placeholder="AI is preparing a contextual draft or write your custom response here..."
        />
      </div>

      {successNotice && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#34d399',
            fontSize: '0.8rem'
          }}
        >
          <CheckCircle size={14} />
          {successNotice}
        </div>
      )}

      {/* Bottom Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          * Sending this response will automatically update ticket status to "In Progress" and stream to the author.
        </span>

        <button
          className="btn btn-primary"
          onClick={handleSendResponse}
          disabled={isSending || !draftText.trim()}
        >
          <Send size={15} />
          {isSending ? 'Sending to Author...' : 'Send Response to Author'}
        </button>
      </div>
    </div>
  );
};
