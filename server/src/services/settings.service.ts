import type { TablesUpdate } from '../types/database.types.js';
import { AppError } from '../errors/app-error.js';
import { fetchSettings, updateSettings } from '../repositories/settings.repository.js';
import type { SettingsPatch } from '../validation/settings.schemas.js';

function mapSettings(row: NonNullable<Awaited<ReturnType<typeof fetchSettings>>>) {
  return { examName: row.exam_name, examDate: row.exam_date, targetMarks: row.target_marks, weekdayStudyHours: row.weekday_study_hours, sundayStudyHours: row.sunday_study_hours, mondayStudyHours: row.monday_study_hours, updatedAt: row.updated_at };
}

export async function getSettings() {
  const settings = await fetchSettings();
  if (!settings) throw new AppError(500, 'SETTINGS_INTEGRITY_ERROR', 'Application settings are missing.');
  return mapSettings(settings);
}

export async function patchSettings(patch: SettingsPatch) {
  const update: TablesUpdate<'app_settings'> = { updated_at: new Date().toISOString() };
  if ('examDate' in patch) update.exam_date = patch.examDate ?? null;
  if (patch.targetMarks !== undefined) update.target_marks = patch.targetMarks;
  if (patch.weekdayStudyHours !== undefined) update.weekday_study_hours = patch.weekdayStudyHours;
  if (patch.sundayStudyHours !== undefined) update.sunday_study_hours = patch.sundayStudyHours;
  if (patch.mondayStudyHours !== undefined) update.monday_study_hours = patch.mondayStudyHours;
  const settings = await updateSettings(update);
  if (!settings) throw new AppError(500, 'SETTINGS_INTEGRITY_ERROR', 'Application settings are missing.');
  return mapSettings(settings);
}
