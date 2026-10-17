import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Database, Sparkles, BookOpen, Clock, ShieldCheck, IndianRupee, Layers } from 'lucide-react';

export const KnowledgeBasePage: React.FC = () => {
  const [kb, setKb] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getKnowledgeBase()
      .then(res => setKb(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading Knowledge Base...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2>BookLeaf Knowledge Base & AI Calibration Center</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Ground-truth company policies, production workflows, and communication tone guidelines injected into the AI Response Assistant.
        </p>
      </div>

      {/* Grid of Policies */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Royalty Policy */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <IndianRupee size={18} className="text-brand" />
              Royalty & Payout Policy
            </div>
            <span className="badge badge-resolved">80/20 Profit Split</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p><strong>Net Profit Formula:</strong> {kb?.royalty_policy?.net_profit_formula}</p>
            <p><strong>Disbursement Cycle:</strong> {kb?.royalty_policy?.cycle}</p>
            <p><strong>Minimum Threshold:</strong> {kb?.royalty_policy?.minimum_payout}</p>
            <p><strong>Payment Method:</strong> {kb?.royalty_policy?.payout_method}</p>
          </div>
        </div>

        {/* ISBN Policy */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BookOpen size={18} color="#38bdf8" />
              ISBN & Metadata Policy
            </div>
            <span className="badge badge-critical">48h SLA</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p><strong>Imprint:</strong> {kb?.isbn_policy?.assignment}</p>
            <p><strong>Custom Imprint:</strong> {kb?.isbn_policy?.custom_imprint}</p>
            <p><strong>Error Escalation:</strong> {kb?.isbn_policy?.errors}</p>
          </div>
        </div>

        {/* Printing & Quality */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="#fbbf24" />
              Printing & Quality Guarantee
            </div>
            <span className="badge badge-high">Free Reprint</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p><strong>Turnaround:</strong> {kb?.printing_and_quality?.turnaround}</p>
            <p><strong>Fulfillment Partners:</strong> {kb?.printing_and_quality?.fulfillment}</p>
            <p><strong>Quality Defect Resolution:</strong> {kb?.printing_and_quality?.quality_defect_policy}</p>
          </div>
        </div>

        {/* Distribution & Availability */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Clock size={18} color="#a3e635" />
              Distribution & Stock Sync
            </div>
            <span className="badge badge-category">Amazon / Flipkart</span>
          </div>
          <div style={{ fontSize: '0.88rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <p><strong>Retail Platforms:</strong> {kb?.distribution_and_availability?.platforms?.join(', ')}</p>
            <p><strong>Listing Turnaround:</strong> {kb?.distribution_and_availability?.listing_turnaround}</p>
            <p><strong>Stock Sync Recovery:</strong> {kb?.distribution_and_availability?.stock_sync_issue}</p>
          </div>
        </div>
      </div>

      {/* Tone Guidelines */}
      <div className="card mb-6">
        <div className="card-header">
          <div className="card-title">
            <Sparkles size={18} className="text-brand" />
            BookLeaf Author Communication Tone Guidelines
          </div>
        </div>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
          {kb?.communication_tone_guidelines?.map((tone: string, idx: number) => (
            <li key={idx}>
              <strong style={{ color: '#2dd4bf' }}>Rule {idx + 1}:</strong> {tone}
            </li>
          ))}
        </ul>
      </div>

      {/* Calibrated Query-Response Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Sample Query & AI Response Calibration Benchmarks</h3>
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Category</th>
                <th style={{ width: '320px' }}>Sample Author Query</th>
                <th>Calibrated Response Policy & Tone Expected</th>
              </tr>
            </thead>
            <tbody>
              {kb?.sample_calibrations?.map((item: any, i: number) => (
                <tr key={i}>
                  <td>
                    <span className="badge badge-category">{item.category}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#f8fafc' }}>
                    "{item.sample_query}"
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {item.expected_guidance}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
