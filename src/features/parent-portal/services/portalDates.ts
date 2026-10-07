export interface TimeWindow {
  start: string;
  end: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function daysAgoISO(days: number, now: Date = new Date()): string {
  return toISODate(addDays(now, -days));
}

export function daysAheadISO(days: number, now: Date = new Date()): string {
  return toISODate(addDays(now, days));
}

/**
 * Reporting window: a rolling block of `days` calendar days ending on (and
 * including) `end`. The previous period is the same-length block that ends
 * the day before the current window starts, which keeps week-over-week
 * comparisons aligned no matter which weekday the report is generated.
 */
export function rollingWindow(end: string, days = 7): TimeWindow {
  const endDate = parseISODate(end);
  return { start: toISODate(addDays(endDate, -(days - 1))), end };
}

export function previousWindow(window: TimeWindow): TimeWindow {
  const length = countDays(window);
  const prevEnd = addDays(parseISODate(window.start), -1);
  return { start: toISODate(addDays(prevEnd, -(length - 1))), end: toISODate(prevEnd) };
}

export function isDateWithin(date: string, window: TimeWindow): boolean {
  return date >= window.start && date <= window.end;
}

export function countDays(window: TimeWindow): number {
  const ms = parseISODate(window.end).getTime() - parseISODate(window.start).getTime();
  return Math.round(ms / 86400000) + 1;
}

export function weekdayName(date: string, locale: 'en' | 'sw' = 'en'): string {
  const day = parseISODate(date).getDay();
  const en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sw = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
  return (locale === 'sw' ? sw : en)[day];
}

export function shortDate(date: string): string {
  return parseISODate(date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}
