'use client';

import { useCallback, useEffect, useState } from 'react';
import { adjacentSeedId, EMPTY_SELECTION, normalizePlotSelection, parsePlotQuery, PlotSelection, SelectionData, writePlotQuery } from '@/lib/plot-selection';

export function usePlotSelection(data: SelectionData, ready: boolean) {
  const [selection, setSelection] = useState<PlotSelection>(EMPTY_SELECTION);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const restore = () => {
      setSelection(normalizePlotSelection(parsePlotQuery(new URLSearchParams(window.location.search)), data));
      setHydrated(true);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [data, ready]);

  useEffect(() => {
    if (!ready || !hydrated) return;
    const url = writePlotQuery(new URL(window.location.href), selection);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
  }, [selection, ready, hydrated]);

  const updateSelection = useCallback((change: Partial<PlotSelection>) => {
    setSelection((current) => normalizePlotSelection({ ...current, ...change }, data));
  }, [data]);

  const moveSeed = useCallback((direction: -1 | 1, filteredSeeds = data.seeds) => {
    setSelection((current) => ({ ...current, seedId: adjacentSeedId(filteredSeeds, current.seedId, direction) }));
  }, [data.seeds]);

  return { selection, updateSelection, moveSeed, hydrated };
}
