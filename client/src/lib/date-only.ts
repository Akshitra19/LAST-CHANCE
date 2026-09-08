export type CountdownState =
  | { kind: 'unset'; label: 'Exam date not set' }
  | { kind: 'future'; label: string; days: number }
  | { kind: 'today'; label: 'Exam day'; days: 0 }
  | { kind: 'past'; label: 'Exam date passed'; days: 0 };

const dayMilliseconds = 86_400_000;

export function parseDateOnly(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const normalized = new Date(Date.UTC(year, month - 1, day));
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() !== month - 1 || normalized.getUTCDate() !== day) return null;
  return { year, month, day };
}

export function calendarDaysUntil(value: string, now = new Date()): number | null {
  const date = parseDateOnly(value);
  if (!date) return null;
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const target = Date.UTC(date.year, date.month - 1, date.day);
  return Math.round((target - today) / dayMilliseconds);
}

export function getCountdown(examDate: string | null, now = new Date()): CountdownState {
  if (!examDate) return { kind: 'unset', label: 'Exam date not set' };
  const days = calendarDaysUntil(examDate, now);
  if (days === null) return { kind: 'unset', label: 'Exam date not set' };
  if (days < 0) return { kind: 'past', label: 'Exam date passed', days: 0 };
  if (days === 0) return { kind: 'today', label: 'Exam day', days: 0 };
  return { kind: 'future', label: `${days} ${days === 1 ? 'day' : 'days'} remaining`, days };
}

export function studyHoursForToday(settings: { mondayStudyHours: number; sundayStudyHours: number; weekdayStudyHours: number }, now = new Date()): number {
  if (now.getDay() === 0) return settings.sundayStudyHours;
  if (now.getDay() === 1) return settings.mondayStudyHours;
  return settings.weekdayStudyHours;
}

export function localDateOnly(now = new Date()): string { return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
export function addCalendarDays(value: string, amount: number): string { const parsed = parseDateOnly(value); if (!parsed) throw new Error('Invalid date.'); const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + amount)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`; }
export function formatDateOnly(value: string): string { const parsed = parseDateOnly(value); if (!parsed) return value; return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))); }
