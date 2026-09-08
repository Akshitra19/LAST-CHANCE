import { z } from 'zod';

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}, 'Invalid calendar date.');

export const settingsPatchSchema = z.object({
  examDate: dateOnly.nullish(),
  targetMarks: z.number().finite().min(0).max(100).optional(),
  weekdayStudyHours: z.number().finite().min(0).max(24).optional(),
  sundayStudyHours: z.number().finite().min(0).max(24).optional(),
  mondayStudyHours: z.number().finite().min(0).max(24).optional()
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one mutable settings field is required.');

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
