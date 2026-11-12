import { Metals } from '../const/metals';
import { History, LatestSnapshot, PriceMap } from '../types/metal';
import { toDateKey } from '../util/dates';

const BASE_URL = 'https://api.metals.dev/v1';

export const MAX_TIMESERIES_DAYS = 30;

const ErrorMessages: Record<number, string> = {
  1101: 'The metals.dev API key is invalid. Update it in Settings.',
  1203: 'The monthly metals.dev request quota has been used up. It resets on the 1st of the month.',
};

const request = async (path: string, apiKey: string, params: Record<string, string>, onRequest: () => void) => {
  const query = new URLSearchParams({ api_key: apiKey, ...params });
  onRequest();
  const response = await fetch(`${BASE_URL}/${path}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => null);
  if (data?.status !== 'success') {
    const code = data?.error_code;
    throw new Error(ErrorMessages[code] ?? data?.error_message ?? `metals.dev request failed (HTTP ${response.status})`);
  }
  return data;
};

const pickMetals = (source: Record<string, unknown> | undefined): PriceMap => {
  const prices: PriceMap = {};
  Metals.forEach(({ id }) => {
    const value = source?.[id];
    if (typeof value === 'number') {
      prices[id] = value;
    }
  });
  return prices;
};

export const fetchLatest = async (apiKey: string, onRequest: () => void): Promise<LatestSnapshot> => {
  const data = await request('latest', apiKey, { currency: 'USD', unit: 'toz' }, onRequest);
  return {
    prices: pickMetals(data.metals),
    timestamp: data.timestamps?.metal ?? data.timestamp ?? new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
  };
};

export const fetchTimeseries = async (apiKey: string, startDate: string, endDate: string, onRequest: () => void): Promise<History> => {
  const data = await request('timeseries', apiKey, { start_date: startDate, end_date: endDate }, onRequest);
  const history: History = {};
  Object.entries(data.rates ?? {}).forEach(([date, rate]: [string, any]) => {
    history[date] = pickMetals(rate?.metals);
  });
  return history;
};

export const snapshotDateKey = (snapshot: LatestSnapshot): string => {
  const date = new Date(snapshot.timestamp);
  return toDateKey(isNaN(date.getTime()) ? new Date() : date);
};
