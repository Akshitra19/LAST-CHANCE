import { studyHoursForToday } from './date-only';

export function studyTargetHours(
  settings: { mondayStudyHours: number; saturdayStudyHours: number; sundayStudyHours: number; weekdayStudyHours: number },
  plannedMinutes: readonly number[],
  now = new Date()
): number {
  return plannedMinutes.length > 0 ? plannedMinutes.reduce((sum, minutes) => sum + minutes, 0) / 60 : studyHoursForToday(settings, now);
}
