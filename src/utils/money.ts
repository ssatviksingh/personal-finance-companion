/** Store and compute money as integer cents to avoid float issues. */

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function parseAmountInput(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, '');
  if (trimmed === '') return null;
  const n = Number.parseFloat(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  return dollarsToCents(n);
}

export function formatCurrency(
  cents: number,
  options?: { showSign?: boolean }
): string {
  const dollars = centsToDollars(Math.abs(cents));
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
  if (options?.showSign) {
    if (cents > 0) return `+${formatted}`;
    if (cents < 0) return `-${new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(dollars))}`;
  }
  return formatted;
}
