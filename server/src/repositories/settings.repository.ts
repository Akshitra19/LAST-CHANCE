import { AppError } from '../errors/app-error.js';
import { getSupabaseClient } from '../config/supabase.js';
import type { Tables, TablesUpdate } from '../types/database.types.js';

export type SettingsRow = Pick<Tables<'app_settings'>, 'exam_name' | 'exam_date' | 'target_marks' | 'weekday_study_hours' | 'saturday_study_hours' | 'sunday_study_hours' | 'monday_study_hours' | 'updated_at'>;

function clientOrThrow() {
  const client = getSupabaseClient();
  if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return client;
}

export async function fetchSettings(): Promise<SettingsRow | null> {
  const { data, error } = await clientOrThrow().from('app_settings').select('exam_name,exam_date,target_marks,weekday_study_hours,saturday_study_hours,sunday_study_hours,monday_study_hours,updated_at').eq('singleton_key', 'default').maybeSingle();
  if (error) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return data;
}

export async function updateSettings(update: TablesUpdate<'app_settings'>): Promise<SettingsRow | null> {
  const { data, error } = await clientOrThrow().from('app_settings').update(update).eq('singleton_key', 'default').select('exam_name,exam_date,target_marks,weekday_study_hours,saturday_study_hours,sunday_study_hours,monday_study_hours,updated_at').maybeSingle();
  if (error) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return data;
}
