import { DependencyList, RefObject, useLayoutEffect, useRef } from 'react';
import { gsap } from './gsap';

export interface GsapScope<T extends HTMLElement> {
  scope: T;
  /** Selector scoped to the owning element — never queries the global document. */
  q: ReturnType<typeof gsap.utils.selector>;
  reduced: boolean;
  mobile: boolean;
}

/**
 * React-safe GSAP lifecycle. Runs `setup` in a layout effect (before paint, so
 * hidden start states never flash) inside gsap.matchMedia scoped to the returned ref.
 * Everything created in `setup` — tweens, timelines, ScrollTriggers — is reverted on
 * unmount, on dependency change, StrictMode's double-invoke, and when the
 * reduced-motion / mobile conditions flip (setup then re-runs).
 * Callers should `return` early when `reduced` so content is simply shown.
 */
export function useGsapScope<T extends HTMLElement>(
  setup: (s: GsapScope<T>) => void | (() => void),
  deps: DependencyList = []
): RefObject<T> {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia(el);
    // matchMedia only runs the callback when some condition matches, so `all` always does.
    mm.add({ all: 'all', reduced: '(prefers-reduced-motion: reduce)', mobile: '(max-width: 620px)' }, ctx => {
      const c = ctx.conditions as { reduced?: boolean; mobile?: boolean };
      try {
        return setup({ scope: el, q: gsap.utils.selector(el), reduced: !!c.reduced, mobile: !!c.mobile });
      } catch (err) {
        // Animation is an enhancement: if it cannot be set up, undo any partial state and show content.
        console.warn('GSAP setup failed; content left in its default visible state.', err);
        ctx.revert();
      }
    });
    return () => mm.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}
