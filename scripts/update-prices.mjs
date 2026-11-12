// Fetches the latest metals.dev prices and merges them into the data file the site reads.
// Runs in GitHub Actions with the METALS_API_KEY secret, so the key never reaches the browser.
//
//   METALS_API_KEY=... node scripts/update-prices.mjs
//
// Env: DATA_FILE (default public/data/prices.json), FORCE_UPDATE=true to fetch even while the market is closed.
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const API_KEY = process.env.METALS_API_KEY;
const DATA_FILE = process.env.DATA_FILE || 'public/data/prices.json';
const FORCE_UPDATE = process.env.FORCE_UPDATE === 'true';

const BASE_URL = 'https://api.metals.dev/v1';
const METALS = ['gold', 'silver', 'platinum', 'palladium', 'copper'];
const HISTORY_DAYS = 365;
const RETENTION_DAYS = 400;
const MAX_TIMESERIES_DAYS = 30;
// Yesterday's timeseries rates can be published late; observed snapshots cover the gap, so retry sparingly
const TIMESERIES_RETRY_HOURS = 6;

const toDateKey = (date) => date.toISOString().slice(0, 10);

const addDays = (dateKey, days) => {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateKey(date);
};

const splitRange = (start, end) => {
  const ranges = [];
  let cursor = start;
  while (cursor <= end) {
    const chunkEnd = addDays(cursor, MAX_TIMESERIES_DAYS - 1) < end ? addDays(cursor, MAX_TIMESERIES_DAYS - 1) : end;
    ranges.push([cursor, chunkEnd]);
    cursor = addDays(chunkEnd, 1);
  }
  return ranges;
};

// Approximates spot trading hours: closed from Friday ~22:00 UTC until Sunday ~22:00 UTC
const isMarketOpen = (now) => {
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

const pickMetals = (source) => {
  const prices = {};
  METALS.forEach((id) => {
    if (typeof source?.[id] === 'number') {
      prices[id] = source[id];
    }
  });
  return prices;
};

const prune = (history, cutoff) => {
  return Object.fromEntries(Object.entries(history).filter(([date]) => date >= cutoff));
};

let requestCount = 0;

const request = async (path, params) => {
  const query = new URLSearchParams({ api_key: API_KEY, ...params });
  requestCount++;
  const response = await fetch(`${BASE_URL}/${path}?${query.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await response.json().catch(() => null);
  if (data?.status !== 'success') {
    throw new Error(`metals.dev ${path} failed: ${data?.error_code ?? `HTTP ${response.status}`} ${data?.error_message ?? ''}`.trim());
  }
  return data;
};

const readData = async () => {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const setOutput = async (name, value) => {
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
};

const syncTimeseries = async (timeseries, sync, today) => {
  const start = addDays(today, -HISTORY_DAYS);
  const yesterday = addDays(today, -1);

  let ranges = [];
  const needsBackfill = !sync.from || sync.from > start || !sync.through || sync.through < addDays(start, -1);
  if (needsBackfill) {
    ranges = [[start, yesterday]];
  } else if (sync.through < yesterday) {
    const hoursSinceAttempt = sync.attemptedAt ? (Date.now() - Date.parse(sync.attemptedAt)) / 3600000 : Infinity;
    if (hoursSinceAttempt >= TIMESERIES_RETRY_HOURS) {
      ranges = [[addDays(sync.through, 1), yesterday]];
    }
  }

  if (ranges.length === 0) {
    return sync;
  }

  for (const [rangeStart, rangeEnd] of ranges) {
    for (const [chunkStart, chunkEnd] of splitRange(rangeStart, rangeEnd)) {
      const data = await request('timeseries', { start_date: chunkStart, end_date: chunkEnd });
      Object.entries(data.rates ?? {}).forEach(([date, rate]) => {
        timeseries[date] = pickMetals(rate?.metals);
      });
    }
  }

  const newest = Object.keys(timeseries).sort().pop() ?? null;
  return {
    from: needsBackfill ? start : sync.from,
    through: newest && (!sync.through || newest > sync.through) ? newest : sync.through,
    attemptedAt: new Date().toISOString(),
  };
};

const main = async () => {
  if (!API_KEY) {
    throw new Error('METALS_API_KEY is not set');
  }

  const now = new Date();
  const today = toDateKey(now);
  const data = await readData();

  if (!FORCE_UPDATE && data.latest && !isMarketOpen(now)) {
    console.log('Market closed; skipping update');
    await setOutput('updated', 'false');
    return;
  }

  const latestResponse = await request('latest', { currency: 'USD', unit: 'toz' });
  const latest = {
    prices: pickMetals(latestResponse.metals),
    timestamp: latestResponse.timestamps?.metal ?? latestResponse.timestamp ?? now.toISOString(),
  };

  // Timeseries has no copper, so every snapshot is kept as that day's observed price
  const observed = { ...data.observed };
  observed[toDateKey(new Date(latest.timestamp))] = latest.prices;

  const timeseries = { ...data.timeseries };
  let sync = data.sync ?? {};
  try {
    sync = await syncTimeseries(timeseries, sync, today);
  } catch (err) {
    console.log(`::warning::Timeseries update failed, publishing latest prices only: ${err.message}`);
  }

  const cutoff = addDays(today, -RETENTION_DAYS);
  const output = {
    generatedAt: now.toISOString(),
    latest,
    observed: prune(observed, cutoff),
    timeseries: prune(timeseries, cutoff),
    sync,
  };

  await mkdir(dirname(DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(output)}\n`);
  await setOutput('updated', 'true');
  console.log(`Updated ${DATA_FILE} with ${requestCount} metals.dev request(s); prices as of ${latest.timestamp}`);
};

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
