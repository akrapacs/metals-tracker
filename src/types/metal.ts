export type MetalId = 'gold' | 'silver' | 'platinum' | 'palladium' | 'copper';

// USD per troy ounce, as returned by metals.dev
export type PriceMap = Partial<Record<MetalId, number>>;

// Keyed by UTC date (YYYY-MM-DD)
export type History = Record<string, PriceMap>;

export interface LatestSnapshot {
  prices: PriceMap;
  timestamp: string;
}

// Shape of data/prices.json, written by scripts/update-prices.mjs
export interface PriceData {
  generatedAt: string;
  latest: LatestSnapshot | null;
  observed: History;
  timeseries: History;
}

export interface PricePoint {
  date: string;
  price: number;
}

// Prices in the metal's display unit (see MetalConfig.unit)
export interface MetalStats {
  id: MetalId;
  name: string;
  symbol: string;
  unit: string;
  price: number | null;
  change1d: number | null;
  change7d: number | null;
  change30d: number | null;
  low: PricePoint | null;
  high: PricePoint | null;
  fromHigh: number | null;
  rangePosition: number | null;
  series: number[];
}
