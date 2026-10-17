import { useRef } from 'react';

// Returns the ids that appeared after the list was first shown for `scope`
// (e.g. a ticket id). Items present on first render are never "fresh", so
// existing messages don't replay their entrance when the list updates.
export function useFreshItems(ids: string[], scope: string): Set<string> {
  const state = useRef<{ scope: string; seen: Set<string>; fresh: Set<string> } | null>(null);
  if (!state.current || state.current.scope !== scope) {
    state.current = { scope, seen: new Set(ids), fresh: new Set() };
  } else {
    for (const id of ids) {
      if (!state.current.seen.has(id)) {
        state.current.seen.add(id);
        state.current.fresh.add(id);
      }
    }
  }
  return state.current.fresh;
}
