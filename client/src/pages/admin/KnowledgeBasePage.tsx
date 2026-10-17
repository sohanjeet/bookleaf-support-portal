import { CountUp } from '../../components/CountUp';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Barcode, WalletCards, Bot, ChevronDown, ClipboardCheck, Workflow, Info, Search, Printer, MessageSquareText, Truck } from 'lucide-react';
import { api } from '../../services/api';
import { tBase, tSlow, tIndicator, collapseVariants } from '../../motion';
import { gsap } from '../../animation/gsap';
import { ScrollTrigger } from '../../animation/scrollTrigger';
import { ease } from '../../animation/easings';
import { useGsapScope } from '../../animation/useGsapContext';

type KnowledgeBase = {
  royalty_policy: Record<string, string>; isbn_policy: Record<string, string>; printing_and_quality: Record<string, string>;
  distribution_and_availability: { platforms: string[]; listing_turnaround: string; stock_sync_issue: string };
  production_stages: { flow: string[]; updates: string; common_delay_bottlenecks: string };
  communication_tone_guidelines: string[]; sample_calibrations: { category: string; sample_query: string; expected_guidance: string }[];
};
type SectionId = 'royalty' | 'isbn' | 'printing' | 'distribution' | 'production' | 'communication';
const categories: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: 'royalty', label: 'Royalty & Payments', icon: WalletCards }, { id: 'isbn', label: 'ISBN & Metadata', icon: Barcode }, { id: 'printing', label: 'Printing & Quality', icon: Printer }, { id: 'distribution', label: 'Distribution & Availability', icon: Truck }, { id: 'production', label: 'Production Updates', icon: Workflow }, { id: 'communication', label: 'Communication Guidelines', icon: MessageSquareText },
];
const toneTitles = ['Partners, not tickets.', 'Acknowledge first.', 'Be specific.', 'Own mistakes.', 'Give a timeline.', 'Always define the next step.'];
const sectionTransition = tSlow;

export const KnowledgeBasePage: React.FC = () => {
  const [kb, setKb] = useState<KnowledgeBase | null>(null); const [loading, setLoading] = useState(true); const [query, setQuery] = useState(''); const [activeSection, setActiveSection] = useState<SectionId>('royalty'); const [expanded, setExpanded] = useState<SectionId | null>(null);
  const searchRef = useRef<HTMLInputElement>(null); const sectionRefs = useRef<Partial<Record<SectionId, HTMLElement>>>({}); const prefersReducedMotion = useReducedMotion();
  useEffect(() => { api.getKnowledgeBase().then(res => setKb(res.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  useEffect(() => { const focusSearch = (event: KeyboardEvent) => { const target = event.target as HTMLElement | null; if (event.key === '/' && !target?.matches('input, textarea, select, [contenteditable="true"]')) { event.preventDefault(); searchRef.current?.focus(); } }; window.addEventListener('keydown', focusSearch); return () => window.removeEventListener('keydown', focusSearch); }, []);
  useEffect(() => { let frame = 0; const update = () => { frame = 0; const entries = (Object.entries(sectionRefs.current) as [SectionId, HTMLElement | null][]).filter(([, el]) => el); if (!entries.length) return; const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4; let current = entries[0][0]; for (const [id, el] of entries) { if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.3) current = id; } if (atBottom) current = entries[entries.length - 1][0]; setActiveSection(current); }; const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); }; update(); window.addEventListener('scroll', onScroll, { passive: true }); return () => { window.removeEventListener('scroll', onScroll); if (frame) cancelAnimationFrame(frame); }; }, [kb, query]);
  const searchable = useMemo(() => ({ royalty: kb?.royalty_policy, isbn: kb?.isbn_policy, printing: kb?.printing_and_quality, distribution: kb?.distribution_and_availability, production: kb?.production_stages, communication: kb?.communication_tone_guidelines }), [kb]);
  const matches = (id: SectionId) => !query.trim() || `${categories.find(item => item.id === id)?.label} ${JSON.stringify(searchable[id] || '')}`.toLowerCase().includes(query.toLowerCase());

  // Scroll storytelling (GSAP + ScrollTrigger), as progressive enhancement: content is visible by
  // default and nothing is hidden up front. A section is only prepared for its entrance at the moment
  // its trigger fires (i.e. when it is actually about to be seen), so Find, print, screenshots and
  // a failed GSAP all leave full content. `revealed` survives re-runs so nothing replays.
  const revealed = useRef(new Set<string>());
  const visibleKey = categories.filter(c => matches(c.id)).map(c => c.id).join();
  const sectionsRef = useGsapScope<HTMLDivElement>(({ q, reduced, mobile }) => {
    if (reduced) return;
    const timelines: gsap.core.Timeline[] = [];
    const reveal = (section: HTMLElement, id: SectionId) => {
      revealed.current.add(id);
      // Navigated past it (browser Find, anchor, restored scroll): nothing to animate, leave it as is.
      if (section.getBoundingClientRect().bottom <= 0) return;
      const within = gsap.utils.selector(section);
      const tl = gsap.timeline();
      timelines.push(tl);
      try {
      tl.fromTo(section, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: ease.out, clearProps: 'opacity,transform' });
      if (id === 'royalty') {
        // MRP − Printing − Commission − Shipping → Net Profit, then the 80/20 split.
        tl.fromTo(within('.kb-formula > *'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, clearProps: 'opacity,transform' }, 0.2)
          .fromTo(within('.kb-split > div'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.08, clearProps: 'opacity,transform' }, '>-0.1');
      } else if (id === 'production') {
        const steps = within('.kb-workflow li');
        const rail = within('.kb-workflow')[0];
        if (mobile) {
          tl.fromTo(rail, { '--line': 0 }, { '--line': 1, duration: 0.55, ease: ease.inOut, clearProps: '--line' }, 0.1);
        } else {
          tl.fromTo(steps, { '--arrow': 0 }, { '--arrow': 1, duration: 0.25, stagger: 0.06, clearProps: '--arrow' }, 0.3);
        }
        tl.fromTo(steps, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, clearProps: 'opacity,transform' }, 0.15);
      } else if (id === 'communication') {
        const cards = within('.kb-voice-playbook article');
        gsap.set(cards, { transition: 'none' }); // CSS hover transition must not fight the tween
        tl.fromTo(cards, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, clearProps: 'opacity,transform,transition' }, 0.2);
      }
      } catch (err) {
        console.warn('Knowledge Base reveal failed; showing section as-is.', err);
        tl.revert();
      }
    };
    q<HTMLElement>('[data-reveal]').forEach(section => {
      const id = section.dataset.reveal as SectionId;
      if (revealed.current.has(id)) return;
      ScrollTrigger.create({ trigger: section, start: 'top 95%', once: true, onEnter: () => reveal(section, id) });
    });
    // Reverting must always leave content visible, even mid-animation.
    return () => timelines.forEach(tl => { tl.revert(); tl.kill(); });
  }, [kb, visibleKey]);

  // Accordions change page height below them; re-measure the not-yet-fired triggers once settled.
  useEffect(() => {
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 400);
    return () => window.clearTimeout(t);
  }, [expanded]);
  const scrollTo = (id: SectionId) => sectionRefs.current[id]?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  const details = (id: SectionId, content: React.ReactNode) => <div className="kb-details"><button className="kb-details-trigger" type="button" onClick={() => setExpanded(expanded === id ? null : id)} aria-expanded={expanded === id} aria-controls={`${id}-details`}>{expanded === id ? 'Hide policy details' : 'View policy details'} <ChevronDown size={16} aria-hidden="true" className="icon-rotate" /></button><div className="kb-print-only">{content}</div><AnimatePresence initial={false}>{expanded === id && <motion.div id={`${id}-details`} className="kb-details-content" variants={collapseVariants} initial="closed" animate="open" exit="closed">{content}</motion.div>}</AnimatePresence></div>;
  const sectionProps = (id: SectionId) => ({ id: `kb-${id}`, ref: (node: HTMLElement | null) => { if (node) sectionRefs.current[id] = node; }, className: 'kb-section', 'data-reveal': id });
  if (loading) return <div className="kb-loading">Loading knowledge workspace…</div>;
  if (!kb) return <div className="kb-loading">The knowledge base could not be loaded. Please refresh and try again.</div>;

  return <div className="kb-workspace">
    <motion.header className="kb-header" initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={sectionTransition}><div className="kb-header-copy"><h1>Knowledge Base</h1><p>Policies, operational playbooks and communication standards used by BookLeaf support and AI-assisted responses.</p><div className="kb-meta" aria-label="Knowledge base metadata"><span>6 knowledge areas</span><span className="kb-ai-status"><Bot size={14} /> AI context active</span></div></div><label className="kb-search"><Search size={16} aria-hidden="true" /><input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search policies, timelines, platforms…" aria-label="Search knowledge base" /><kbd>/</kbd></label></motion.header>
    <motion.nav className="kb-category-nav" aria-label="Knowledge base categories" initial={prefersReducedMotion ? false : { opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ ...tBase, delay: 0.06 }}>{categories.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={activeSection === id ? 'active' : ''} onClick={() => scrollTo(id)}><Icon size={16} aria-hidden="true" /><span>{label}</span>{activeSection === id && <motion.i layoutId="kb-active-indicator" transition={tIndicator} />}</button>)}</motion.nav>
    <div className="kb-reading-layout"><aside className="kb-progress-rail" aria-label="Reading progress"><span className="kb-progress-line" />{categories.map(({ id, label }) => <button key={id} type="button" onClick={() => scrollTo(id)} className={activeSection === id ? 'active' : ''}><i /><span>{label.split(' & ')[0]}</span></button>)}</aside><div className="kb-sections" ref={sectionsRef}>
      {matches('royalty') && <section {...sectionProps('royalty')}><SectionHeading icon={<WalletCards size={20} />} title="Royalty & Payments" /><p className="kb-intro">The royalty model is designed to make every earning component understandable before a payout is calculated.</p><div className="kb-royalty-grid"><div className="kb-formula" aria-label="Net profit formula"><span>MRP</span><b>−</b><span>Printing Cost</span><b>−</b><span>Platform Commission</span><b>−</b><span>Shipping</span><strong>Net Profit</strong></div><div className="kb-split"><div><strong><CountUp value={80} suffix="%" /></strong><span>Author</span></div><div><strong><CountUp value={20} suffix="%" /></strong><span>BookLeaf</span></div></div></div><div className="kb-fact-row"><div><small>Quarterly calculation</small><b>Payment within 45 days</b></div><div><small>Minimum payout</small><b>₹1,000</b></div><div><small>Payout method</small><b>Direct bank transfer</b></div></div>{details('royalty', <p>{kb.royalty_policy.transparency}</p>)}</section>}
      {matches('isbn') && <section {...sectionProps('isbn')}><SectionHeading icon={<Barcode size={20} />} title="ISBN & Metadata" /><p className="kb-intro">{kb.isbn_policy.assignment}</p><div className="kb-two-column"><div><small>Custom imprint option</small><p>{kb.isbn_policy.custom_imprint}</p></div><div className="kb-emphasis"><small>Error escalation</small><strong><CountUp value={48} /> hours</strong><p>{kb.isbn_policy.errors}</p></div></div></section>}
      {matches('printing') && <section {...sectionProps('printing')}><SectionHeading icon={<Printer size={20} />} title="Printing & Quality" /><p className="kb-intro">Reliable print delivery is matched with a clear remedy when a finished copy does not meet the expected standard.</p><div className="kb-two-column"><div className="kb-emphasis"><small>Standard turnaround</small><strong><CountUp value={5} />–<CountUp value={7} /> days</strong><p>Business days from order confirmation.</p></div><div><small>Fulfilment</small><p>{kb.printing_and_quality.fulfillment}</p></div></div>{details('printing', <p>{kb.printing_and_quality.quality_defect_policy}</p>)}</section>}
      {matches('distribution') && <section {...sectionProps('distribution')}><SectionHeading icon={<Truck size={20} />} title="Distribution & Availability" /><p className="kb-intro">Books are distributed across major marketplaces after publication is complete.</p><div className="kb-platforms" aria-label="Retail platforms">{kb.distribution_and_availability.platforms.map(platform => <span key={platform}>{platform}</span>)}</div><div className="kb-timing-grid"><div><strong><CountUp value={7} />–<CountUp value={10} /> <small>days</small></strong><h3>Listing turnaround</h3><p>{kb.distribution_and_availability.listing_turnaround}</p></div><div><strong><CountUp value={24} />–<CountUp value={48} /> <small>hours</small></strong><h3>Stock recovery</h3><p>{kb.distribution_and_availability.stock_sync_issue}</p></div></div></section>}
      {matches('production') && <section {...sectionProps('production')}><SectionHeading icon={<Workflow size={20} />} title="Production Updates" /><p className="kb-intro">This is the standard publishing workflow, not the current status of any individual author’s book.</p><ol className="kb-workflow">{kb.production_stages.flow.map((stage, index) => <li key={stage}><span>{index + 1}</span><b>{stage}</b></li>)}</ol>{details('production', <><p>{kb.production_stages.updates}</p><p>{kb.production_stages.common_delay_bottlenecks}</p></>)}</section>}
      {matches('communication') && <section {...sectionProps('communication')}><SectionHeading icon={<MessageSquareText size={20} />} title="BookLeaf Communication Standard" /><p className="kb-intro">How every author conversation should sound.</p><div className="kb-voice-playbook">{kb.communication_tone_guidelines.map((tone, index) => <article key={tone}><span>0{index + 1}</span><div><h3>{toneTitles[index]}</h3><p>{tone}</p></div><ArrowRight size={16} aria-hidden="true" /></article>)}</div><div className="kb-calibrations"><div><ClipboardCheck size={20} /><h3>Response calibration benchmarks</h3><p>Reference examples for author ticket responses.</p></div><div>{kb.sample_calibrations.map(item => <details key={item.sample_query}><summary>{item.category}<span>{item.sample_query}</span></summary><p>{item.expected_guidance}</p></details>)}</div></div></section>}
      {!categories.some(category => matches(category.id)) && <motion.div className="kb-empty" initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={tBase}><Info size={24} /><h2>No matching policies</h2><p>Try a different policy, timeline, platform, or communication term.</p></motion.div>}
    </div></div>
  </div>;
};

const SectionHeading: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => <div className="kb-section-heading"><div><span className="kb-icon">{icon}</span><h2>{title}</h2></div><span className="kb-context" title="This policy is available to the AI-assisted response workflow."><Bot size={14} /> AI context</span></div>;
