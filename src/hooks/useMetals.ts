import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchLatest, fetchTimeseries, MAX_TIMESERIES_DAYS, snapshotDateKey } from '../api/metalsDev';
import { Coverage, History, LatestSnapshot, MetalStats, RequestUsage } from '../types/metal';
import { addDays, monthKey, splitRange, todayKey } from '../util/dates';
import { computeStats, extendCoverage, findMissingRanges, mergeHistory, pruneHistory } from '../util/history';
import { useLocalStorage } from './useLocalStorage';

const errorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : `${err}`;
};

export interface MetalsState {
  stats: MetalStats[];
  latest: LatestSnapshot | null;
  usage: RequestUsage;
  error: string | null;
  loading: boolean;
  lastAttemptAt: number | null;
  refresh: () => Promise<void>;
}

export const useMetals = (apiKey: string, historyDays: number): MetalsState => {
  const [latest, setLatest] = useLocalStorage<LatestSnapshot | null>('latest', null);
  const [timeseries, setTimeseries] = useLocalStorage<History>('history', {});
  const [observed, setObserved] = useLocalStorage<History>('observed', {});
  const [coverage, setCoverage] = useLocalStorage<Coverage | null>('historyCoverage', null);
  const [usage, setUsage] = useLocalStorage<RequestUsage>('requestUsage', { month: monthKey(), count: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  const latestInFlight = useRef(false);
  const historyInFlight = useRef(false);

  const today = todayKey();
  const historyStart = addDays(today, -historyDays);
  const historyEnd = addDays(today, -1);

  const missingRanges = useMemo(() => {
    return findMissingRanges(coverage, historyStart, historyEnd);
  }, [coverage, historyStart, historyEnd]);

  const countRequest = useCallback(() => {
    const month = monthKey();
    setUsage((prev) => ({ month, count: prev.month === month ? prev.count + 1 : 1 }));
  }, [setUsage]);

  const syncHistory = useCallback(async () => {
    if (!apiKey || historyInFlight.current || missingRanges.length === 0) {
      return;
    }

    historyInFlight.current = true;
    try {
      const chunks = missingRanges.flatMap(([start, end]) => splitRange(start, end, MAX_TIMESERIES_DAYS));
      for (const [start, end] of chunks) {
        const fetched = await fetchTimeseries(apiKey, start, end, countRequest);
        setTimeseries((prev) => pruneHistory({ ...prev, ...fetched }, todayKey()));
      }
      setCoverage((prev) => extendCoverage(prev, historyStart, historyEnd));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      historyInFlight.current = false;
    }
  }, [apiKey, missingRanges, historyStart, historyEnd, countRequest, setTimeseries, setCoverage]);

  const refreshLatest = useCallback(async () => {
    if (!apiKey || latestInFlight.current) {
      return;
    }

    latestInFlight.current = true;
    setLoading(true);
    setError(null);
    setLastAttemptAt(Date.now());
    try {
      const snapshot = await fetchLatest(apiKey, countRequest);
      setLatest(snapshot);
      setObserved((prev) => pruneHistory({ ...prev, [snapshotDateKey(snapshot)]: snapshot.prices }, todayKey()));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      latestInFlight.current = false;
      setLoading(false);
    }
  }, [apiKey, countRequest, setLatest, setObserved]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshLatest(), syncHistory()]);
  }, [refreshLatest, syncHistory]);

  useEffect(() => {
    setError(null);
    setLastAttemptAt(null);
  }, [apiKey]);

  // Runs when the history window grows or the UTC day rolls over; past days are cached, so this is ~1 request per day
  useEffect(() => {
    syncHistory();
  }, [syncHistory]);

  const stats = useMemo(() => {
    return computeStats(latest, mergeHistory(observed, timeseries), historyDays, today);
  }, [latest, observed, timeseries, historyDays, today]);

  return {
    stats,
    latest,
    usage: usage.month === monthKey() ? usage : { month: monthKey(), count: 0 },
    error,
    loading,
    lastAttemptAt,
    refresh,
  };
};
