export const toDateKey = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const todayKey = (): string => {
  return toDateKey(new Date());
};

export const monthKey = (): string => {
  return new Date().toISOString().slice(0, 7);
};

export const addDays = (dateKey: string, days: number): string => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

export const splitRange = (start: string, end: string, maxDays: number): [string, string][] => {
  const ranges: [string, string][] = [];
  let cursor = start;
  while (cursor <= end) {
    const chunkEnd = addDays(cursor, maxDays - 1) < end ? addDays(cursor, maxDays - 1) : end;
    ranges.push([cursor, chunkEnd]);
    cursor = addDays(chunkEnd, 1);
  }
  return ranges;
};

// Approximates spot trading hours: closed from Friday ~22:00 UTC until Sunday ~22:00 UTC
export const isMarketOpen = (now: Date = new Date()): boolean => {
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  if (day === 6) {
    return false;
  }
  if (day === 5 && hour >= 22) {
    return false;
  }
  if (day === 0 && hour < 22) {
    return false;
  }
  return true;
};
