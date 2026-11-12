import dayjs from 'dayjs';

const percentFormatter = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const formatPercent = (n: number): string => {
  return `${percentFormatter.format(n * 100)}%`;
}

export const formatSignedPercent = (n: number): string => {
  const sign = n > 0 ? '+' : '';
  return `${sign}${formatPercent(n)}`;
}

const currencyFormatter = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2, style: 'currency', currency: 'USD' });
const smallCurrencyFormatter = new Intl.NumberFormat('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 4, style: 'currency', currency: 'USD' });
export const formatCurrency = (n: number): string => {
  if (n < 10) {
    return smallCurrencyFormatter.format(n);
  }
  return currencyFormatter.format(n);
}

export const formatDateKey = (dateKey: string): string => {
  return dayjs(dateKey).format('MMM D, YYYY');
}
