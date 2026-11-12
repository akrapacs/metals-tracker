import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { LatestSnapshot, MetalStats, PriceData } from '../types/metal';
import { todayKey } from '../util/dates';
import { computeStats, mergeHistory } from '../util/history';

// The data file is a static asset, so polling it costs no metals.dev requests
const POLL_INTERVAL_MS = 5 * 60 * 1000;

export interface PricesState {
  stats: MetalStats[];
  latest: LatestSnapshot | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const usePrices = (historyDays: number): PricesState => {
  const { basePath } = useRouter();
  const [data, setData] = useState<PriceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${basePath}/data/prices.json?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Couldn't load prices (HTTP ${response.status})`);
      }
      setData(await response.json());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : `${err}`);
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    refresh();

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const interval = setInterval(refreshIfVisible, POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [refresh]);

  const today = todayKey();
  const stats = useMemo(() => {
    const history = data ? mergeHistory(data.observed ?? {}, data.timeseries ?? {}) : {};
    return computeStats(data?.latest ?? null, history, historyDays, today);
  }, [data, historyDays, today]);

  return {
    stats,
    latest: data?.latest ?? null,
    error,
    loading,
    refresh,
  };
};
