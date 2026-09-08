import { z } from 'zod';

export const taskTypes = ['THEORY', 'PRACTICE', 'PYQ', 'REVISION', 'TEST', 'MATH', 'APTITUDE'] as const;
export const taskStatuses = ['TODO', 'DONE', 'SKIPPED'] as const;
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day!));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month! - 1 && date.getUTCDate() === day;
}, 'Invalid calendar date.');
const nullableUuid = z.string().uuid().nullable().optional();
const notes = z.string().trim().max(1000).nullable().optional();

export const listTasksQuerySchema = z.object({ date: dateOnly }).strict();
export const taskIdSchema = z.string().uuid();
export const createDailyTaskSchema = z.object({ taskDate: dateOnly, taskType: z.enum(taskTypes), plannedMinutes: z.number().int().min(1).max(1440), subjectId: nullableUuid, topicId: nullableUuid, notes }).strict();
export const updateDailyTaskSchema = z.object({ taskDate: dateOnly.optional(), taskType: z.enum(taskTypes).optional(), plannedMinutes: z.number().int().min(1).max(1440).optional(), actualMinutes: z.number().int().min(0).max(1440).nullable().optional(), subjectId: nullableUuid, topicId: nullableUuid, notes, status: z.enum(taskStatuses).optional() }).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.');

export type CreateDailyTask = z.infer<typeof createDailyTaskSchema>;
export type UpdateDailyTask = z.infer<typeof updateDailyTaskSchema>;
