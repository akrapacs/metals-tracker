import { Metals } from '../const/metals';
import { History, LatestSnapshot, MetalStats, PricePoint } from '../types/metal';
import { addDays } from './dates';

const LOOKBACK_TOLERANCE_DAYS = 3;

// Timeseries data wins; observed snapshots fill in metals the timeseries endpoint does not return (e.g. copper)
export const mergeHistory = (observed: History, timeseries: History): History => {
  const merged: History = {};
  Object.keys(observed).forEach((date) => {
    merged[date] = { ...observed[date] };
  });
  Object.keys(timeseries).forEach((date) => {
    merged[date] = { ...merged[date], ...timeseries[date] };
  });
  return merged;
};

export const computeStats = (latest: LatestSnapshot | null, history: History, historyDays: number, today: string): MetalStats[] => {
  const start = addDays(today, -historyDays);
  const dates = Object.keys(history).filter((date) => date >= start && date < today).sort();

  return Metals.map((metal): MetalStats => {
    const toUnit = (pricePerTroyOunce: number) => pricePerTroyOunce * metal.troyOuncesPerUnit;

    const points: PricePoint[] = [];
    dates.forEach((date) => {
      const value = history[date][metal.id];
      if (typeof value === 'number') {
        points.push({ date, price: toUnit(value) });
      }
    });

    const current = latest?.prices[metal.id];
    const price = typeof current === 'number' ? toUnit(current) : null;
    const allPoints = price !== null ? [...points, { date: today, price }] : points;

    const priceDaysAgo = (days: number): number | null => {
      const target = addDays(today, -days);
      const earliest = addDays(target, -LOOKBACK_TOLERANCE_DAYS);
      for (let i = points.length - 1; i >= 0; i--) {
        if (points[i].date <= target) {
          return points[i].date >= earliest ? points[i].price : null;
        }
      }
      return null;
    };

    const changeSince = (days: number): number | null => {
      const base = priceDaysAgo(days);
      return price !== null && base ? (price - base) / base : null;
    };

    const hasHistory = points.length > 0;
    const low = hasHistory ? allPoints.reduce((a, b) => (b.price < a.price ? b : a)) : null;
    const high = hasHistory ? allPoints.reduce((a, b) => (b.price > a.price ? b : a)) : null;
    const fromHigh = price !== null && high ? (price - high.price) / high.price : null;
    const rangePosition = price !== null && low && high && high.price > low.price
      ? (price - low.price) / (high.price - low.price)
      : null;

    return {
      id: metal.id,
      name: metal.name,
      symbol: metal.symbol,
      unit: metal.unit,
      price,
      change1d: changeSince(1),
      change7d: changeSince(7),
      change30d: changeSince(30),
      low,
      high,
      fromHigh,
      rangePosition,
      series: allPoints.map((point) => point.price),
    };
  });
};
