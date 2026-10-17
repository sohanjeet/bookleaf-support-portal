import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  locale?: string;
}

// Exponential ease-out: fast start, long settle — matches the rest of the motion language.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// Counts from 0 to `value` once, the first time the figure scrolls into view.
// Later changes to `value` (live data) tween from the figure currently shown.
// Reduced motion shows the final number immediately. Screen readers get the final value only.
export const CountUp: React.FC<Props> = ({ value, prefix = '', suffix = '', duration = 1.3, locale = 'en-IN' }) => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const raf = useRef<number>();
  const [inView, setInView] = useState(false);
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced || inView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setInView(true); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, inView]);

  useEffect(() => {
    if (reduced) { shown.current = value; setDisplay(value); return; }
    if (!inView) return;
    const from = shown.current;
    const to = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const ms = (from === 0 ? duration : Math.min(duration, 0.6)) * 1000;
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      const v = Math.round(from + (to - from) * easeOutExpo(p));
      shown.current = v;
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value, inView, reduced, duration]);

  const final = `${prefix}${value.toLocaleString(locale)}${suffix}`;
  return (
    <span ref={ref} style={{ position: 'relative', fontVariantNumeric: 'lining-nums tabular-nums' }}>
      <span aria-hidden="true">{prefix}{display.toLocaleString(locale)}{suffix}</span>
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>{final}</span>
    </span>
  );
};
