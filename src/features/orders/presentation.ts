export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount);
}

export function formatOrderDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatCompactDate(value: string): string {
  return value.replaceAll('-', '');
}

export function dateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function defaultDateRange(today = new Date()): Readonly<{ startDate: string; endDate: string }> {
  const start = new Date(today);
  start.setDate(start.getDate() - 90);
  return { startDate: dateInputValue(start), endDate: dateInputValue(today) };
}
