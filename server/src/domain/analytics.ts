import { mistakeTypes, summarizeOutcomes, type MistakeType, type ResultOutcome } from './results.js';

export const analyticsRanges = ['7D', '30D', '90D', 'ALL'] as const;
export const analyticsTestTypes = ['ALL', 'TOPIC', 'CUSTOM', 'FULL_MOCK'] as const;
export const testTypes = ['TOPIC', 'CUSTOM', 'FULL_MOCK'] as const;
export const syllabusStatuses = ['NOT_STARTED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'MASTERED', 'WEAK'] as const;
export const mistakeCategories = [...mistakeTypes, 'UNCLASSIFIED'] as const;
export const analyticsTimezone = 'Asia/Kolkata' as const;

export type AnalyticsRange = typeof analyticsRanges[number];
export type AnalyticsTestType = typeof analyticsTestTypes[number];
export type TestType = typeof testTypes[number];
export type SyllabusStatus = typeof syllabusStatuses[number];
export type MistakeCategory = typeof mistakeCategories[number];

export class AnalyticsIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AnalyticsIntegrityError';
  }
}

function invalid(message: string): never { throw new AnalyticsIntegrityError(message); }
export const roundMetric = (value: number): number => Number(value.toFixed(2));

export function scorePercent(score: number, totalMarks: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(totalMarks) || totalMarks <= 0) invalid('A submitted test has invalid score totals.');
  if (score > totalMarks + 0.000001) invalid('A submitted test score exceeds its available marks.');
  return (score / totalMarks) * 100;
}

export function average(values: readonly number[]): number | null {
  if (!values.length) return null;
  if (values.some((value) => !Number.isFinite(value))) invalid('An analytics average contains an invalid value.');
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function adherencePercent(actualMinutes: number, plannedMinutes: number): number | null {
  if (!Number.isFinite(actualMinutes) || !Number.isFinite(plannedMinutes) || actualMinutes < 0 || plannedMinutes < 0) invalid('Study time contains an invalid value.');
  return plannedMinutes === 0 ? null : (actualMinutes / plannedMinutes) * 100;
}

const pad = (value: number) => String(value).padStart(2, '0');
export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) invalid('Analytics date is invalid.');
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function istDateKey(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.valueOf())) invalid('Analytics timestamp is invalid.');
  const shifted = new Date(date.valueOf() + 330 * 60_000);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

export function analyticsBounds(range: AnalyticsRange, now = new Date()) {
  const today = istDateKey(now);
  const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : null;
  const startDate = days ? addDays(today, -(days - 1)) : null;
  const endDateExclusive = addDays(today, 1);
  const instant = (date: string) => new Date(`${date}T00:00:00+05:30`).toISOString();
  return { today, startDate, endDate: today, startInstant: startDate ? instant(startDate) : null, endInstant: instant(endDateExclusive) };
}

export function inDateRange(dateKey: string, startDate: string | null, endDate: string): boolean {
  return (!startDate || dateKey >= startDate) && dateKey <= endDate;
}

function mondayOf(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const weekday = new Date(Date.UTC(year!, month! - 1, day)).getUTCDay();
  return addDays(dateKey, -((weekday + 6) % 7));
}

function dateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(year!, month! - 1, day)));
}

function weekLabel(startDate: string, endDate: string): string {
  const start = dateLabel(startDate); const end = dateLabel(endDate);
  const startMonth = start.split(' ')[1]; const endMonth = end.split(' ')[1];
  return startMonth === endMonth ? `${start.split(' ')[0]}–${end}` : `${start}–${end}`;
}

export type StudySource = { taskDate: string; plannedMinutes: number; actualMinutes: number | null };
export type StudyBucket = { startDate: string; endDate: string; label: string; plannedMinutes: number; actualMinutes: number };

export function buildStudyTrend(tasks: readonly StudySource[], range: AnalyticsRange, today: string): StudyBucket[] {
  const boundedStart = range === '7D' ? addDays(today, -6) : range === '30D' ? addDays(today, -29) : range === '90D' ? addDays(today, -89) : null;
  const filtered = tasks.filter((task) => inDateRange(task.taskDate, boundedStart, today));
  if (range === 'ALL' && filtered.length === 0) return [];
  if (range === '7D' || range === '30D') {
    const byDate = new Map<string, StudyBucket>();
    for (let date = boundedStart!; date <= today; date = addDays(date, 1)) byDate.set(date, { startDate: date, endDate: date, label: dateLabel(date), plannedMinutes: 0, actualMinutes: 0 });
    for (const task of filtered) {
      const bucket = byDate.get(task.taskDate); if (!bucket) continue;
      bucket.plannedMinutes += task.plannedMinutes; bucket.actualMinutes += task.actualMinutes ?? 0;
    }
    return [...byDate.values()];
  }
  const firstDate = boundedStart ?? filtered.map((task) => task.taskDate).sort()[0]!;
  const firstMonday = mondayOf(firstDate); const lastMonday = mondayOf(today);
  const byWeek = new Map<string, StudyBucket>();
  for (let start = firstMonday; start <= lastMonday; start = addDays(start, 7)) {
    const end = addDays(start, 6);
    byWeek.set(start, { startDate: start, endDate: end, label: weekLabel(start, end), plannedMinutes: 0, actualMinutes: 0 });
  }
  for (const task of filtered) {
    const bucket = byWeek.get(mondayOf(task.taskDate)); if (!bucket) continue;
    bucket.plannedMinutes += task.plannedMinutes; bucket.actualMinutes += task.actualMinutes ?? 0;
  }
  return [...byWeek.values()];
}

export type SubjectAnswerFact = { subjectId: string; outcome: ResultOutcome; timeSeconds: number };
export type SubjectReference = { id: string; code: string; name: string; displayOrder: number };
export function aggregateSubjects(subjects: readonly SubjectReference[], answers: readonly SubjectAnswerFact[]) {
  return subjects.flatMap((subject) => {
    const rows = answers.filter((answer) => answer.subjectId === subject.id);
    if (!rows.length) return [];
    if (rows.some((row) => !Number.isInteger(row.timeSeconds) || row.timeSeconds < 0)) invalid('Question time contains an invalid value.');
    const counts = summarizeOutcomes(rows.map((row) => row.outcome));
    const totalTimeSeconds = rows.reduce((sum, row) => sum + row.timeSeconds, 0);
    return [{ subjectId: subject.id, subjectCode: subject.code, subjectName: subject.name, displayOrder: subject.displayOrder, ...counts,
      accuracyPercent: counts.attemptedCount === 0 ? null : roundMetric((counts.correctCount / counts.attemptedCount) * 100),
      totalTimeSeconds, averageTimePerQuestionSeconds: roundMetric(totalTimeSeconds / rows.length) }];
  });
}

export function aggregateMistakes(rows: readonly { outcome: ResultOutcome; mistakeType: string | null }[]) {
  const counts = new Map<MistakeCategory, number>(mistakeCategories.map((category) => [category, 0]));
  for (const row of rows) {
    if (row.outcome === 'CORRECT') continue;
    const category: MistakeCategory = row.mistakeType === null ? 'UNCLASSIFIED' : mistakeTypes.includes(row.mistakeType as MistakeType) ? row.mistakeType as MistakeType : invalid('A mistake category is invalid.');
    counts.set(category, counts.get(category)! + 1);
  }
  const items = mistakeCategories.map((category) => ({ category, count: counts.get(category)! }));
  const total = items.reduce((sum, item) => sum + item.count, 0); const unclassified = counts.get('UNCLASSIFIED')!; const classified = total - unclassified;
  return { items, total, classified, unclassified, classificationRatePercent: total === 0 ? 0 : roundMetric((classified / total) * 100) };
}

export function aggregateSyllabus(statuses: readonly string[]) {
  const counts = new Map<SyllabusStatus, number>(syllabusStatuses.map((status) => [status, 0]));
  for (const status of statuses) {
    if (!syllabusStatuses.includes(status as SyllabusStatus)) invalid('A syllabus status is invalid.');
    counts.set(status as SyllabusStatus, counts.get(status as SyllabusStatus)! + 1);
  }
  const totalTopics = statuses.length;
  return { totalTopics, items: syllabusStatuses.map((status) => ({ status, count: counts.get(status)!, percentage: totalTopics === 0 ? 0 : roundMetric((counts.get(status)! / totalTopics) * 100) })) };
}
