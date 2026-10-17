import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../animation/gsap';
import { dur, ease } from '../animation/easings';

interface Props {
  /** True while the app is genuinely bootstrapping (session restore). */
  loading: boolean;
  /** Fires exactly once, when the loader has fully left the screen (or could not animate). */
  onExitComplete?: () => void;
}

// After this long without finishing we say so honestly instead of looping silently.
const SLOW_MS = 8000;

/**
 * Full-screen branded boot loader: an open book whose pages unfold from the spine.
 * Owns its GSAP timeline, exits as soon as `loading` goes false (never waits for the
 * entrance to finish) and unmounts itself afterwards.
 */
export const BookLeafLoader: React.FC<Props> = ({ loading, onExitComplete }) => {
  const root = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<gsap.Context | null>(null);
  const entranceRef = useRef<gsap.core.Timeline | null>(null);
  const [mounted, setMounted] = useState(true);
  const [slow, setSlow] = useState(false);
  const exitCb = useRef(onExitComplete);
  exitCb.current = onExitComplete;
  const signalled = useRef(false);
  const signalExit = () => {
    if (signalled.current) return;
    signalled.current = true;
    exitCb.current?.();
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (prefersReducedMotion()) {
        // No choreography: the finished mark simply fades in.
        entranceRef.current = gsap.timeline().fromTo('.bl-content', { opacity: 0 }, { opacity: 1, duration: dur.fast, ease: 'none' });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: ease.out } });
      tl.fromTo('.bl-mark', { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3 })
        // Pages unfold outward from the spine (x = 32 in the 64×56 viewBox).
        .fromTo('.bl-page-l', { scaleX: 0, opacity: 0, svgOrigin: '32 30' }, { scaleX: 1, opacity: 1, duration: 0.45, ease: ease.outStrong }, 0.15)
        .fromTo('.bl-page-r', { scaleX: 0, opacity: 0, svgOrigin: '32 30' }, { scaleX: 1, opacity: 1, duration: 0.45, ease: ease.outStrong }, '<0.05')
        .fromTo('.bl-spine', { scaleY: 0, svgOrigin: '32 16' }, { scaleY: 1, duration: 0.28 }, 0.45)
        .fromTo('.bl-leaf', { scale: 0, rotate: -24, svgOrigin: '32 16' }, { scale: 1, rotate: 0, duration: 0.3 }, 0.55)
        .fromTo('.bl-word', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35 }, 0.65)
        .fromTo('.bl-msg', { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.85);
      entranceRef.current = tl;
    }, root);
    ctxRef.current = ctx;
    return () => {
      ctx.revert();
      ctxRef.current = null;
      entranceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!loading) return;
    const t = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => window.clearTimeout(t);
  }, [loading]);

  // Exit: starts the moment the app is ready, from whatever point the entrance reached.
  useLayoutEffect(() => {
    const ctx = ctxRef.current;
    const el = root.current;
    if (loading || !ctx || !el) return;
    const done = () => {
      setMounted(false);
      signalExit();
    };
    try {
      ctx.add(() => {
        entranceRef.current?.pause();
        el.style.pointerEvents = 'none';
        if (prefersReducedMotion()) {
          done(); // same handoff, no choreography
          return;
        }
        // The mark fades, then the cover slides away. It is never cross-faded: a translucent
        // light layer over the dark login panel would read as a grey wash.
        gsap.timeline({ onComplete: done })
          .to('.bl-content', { scale: 0.96, opacity: 0, duration: 0.16, ease: ease.in })
          .to(el, { yPercent: -100, duration: 0.3, ease: ease.inOut }, 0.05);
      });
    } catch {
      done();
    }
  }, [loading]);

  if (!mounted) return null;

  return (
    <div ref={root} className="bl-loader" role="status" aria-live="polite" aria-label="Loading BookLeaf">
      <div className="bl-content">
        <svg className="bl-mark" viewBox="0 0 64 56" width="72" height="63" aria-hidden="true">
          <path className="bl-page-l" d="M32 18 C24 14 14 14 5 17 V51 C14 48 24 48 32 52 Z" />
          <path className="bl-page-r" d="M32 18 C40 14 50 14 59 17 V51 C50 48 40 48 32 52 Z" />
          <path className="bl-spine" d="M32 18 V52" />
          <path className="bl-leaf" d="M32 16 C31 9 36 3 44 2 C45 9 40 15 32 16 Z" />
        </svg>
        <div className="bl-word">BOOKLEAF</div>
        <div className="bl-msg">{slow ? 'Still connecting…' : 'Preparing your workspace'}</div>
      </div>
    </div>
  );
};
