import { MetalId } from '../types/metal';

export interface MetalConfig {
  id: MetalId;
  name: string;
  symbol: string;
  unit: string;
  troyOuncesPerUnit: number;
}

export const Metals: MetalConfig[] = [
  { id: 'gold', name: 'Gold', symbol: 'XAU', unit: 'oz t', troyOuncesPerUnit: 1 },
  { id: 'silver', name: 'Silver', symbol: 'XAG', unit: 'oz t', troyOuncesPerUnit: 1 },
  { id: 'platinum', name: 'Platinum', symbol: 'XPT', unit: 'oz t', troyOuncesPerUnit: 1 },
  { id: 'palladium', name: 'Palladium', symbol: 'XPD', unit: 'oz t', troyOuncesPerUnit: 1 },
  { id: 'copper', name: 'Copper', symbol: 'XCU', unit: 'oz t', troyOuncesPerUnit: 1 },
];

export interface HistoryWindow {
  days: number;
  label: string;
}

export const HistoryWindows: HistoryWindow[] = [
  { days: 30, label: '30D' },
  { days: 90, label: '90D' },
  { days: 180, label: '6M' },
  { days: 365, label: '1Y' },
];

export const DefaultHistoryDays = 90;
