import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types.js';

export type DailyTaskRow = Tables<'daily_tasks'>;
export type SubjectReference = Pick<Tables<'subjects'>, 'id' | 'code' | 'name'>;
export type TopicReference = Pick<Tables<'topics'>, 'id' | 'subject_id' | 'code' | 'name'>;
const columns = 'id,task_date,subject_id,topic_id,task_type,planned_minutes,actual_minutes,status,started_at,completed_at,notes,created_at,updated_at';

function db() { const client = getSupabaseClient(); if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); return client; }
function failed(): never { throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); }

export async function listTaskRows(date: string): Promise<DailyTaskRow[]> { const { data, error } = await db().from('daily_tasks').select(columns).eq('task_date', date).order('created_at').order('id'); if (error) failed(); return data; }
export async function findTaskRow(id: string): Promise<DailyTaskRow | null> { const { data, error } = await db().from('daily_tasks').select(columns).eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function createTaskRow(input: TablesInsert<'daily_tasks'>): Promise<DailyTaskRow> { const { data, error } = await db().from('daily_tasks').insert(input).select(columns).single(); if (error) failed(); return data; }
export async function updateTaskRow(id: string, update: TablesUpdate<'daily_tasks'>): Promise<DailyTaskRow | null> { const { data, error } = await db().from('daily_tasks').update(update).eq('id', id).select(columns).maybeSingle(); if (error) failed(); return data; }
export async function deleteTaskRow(id: string): Promise<boolean> { const { data, error } = await db().from('daily_tasks').delete().eq('id', id).select('id').maybeSingle(); if (error) failed(); return Boolean(data); }
export async function findActiveTaskRow(): Promise<Pick<DailyTaskRow, 'id'> | null> { const { data, error } = await db().from('daily_tasks').select('id').not('started_at', 'is', null).limit(1).maybeSingle(); if (error) failed(); return data; }
export async function findSubject(id: string): Promise<SubjectReference | null> { const { data, error } = await db().from('subjects').select('id,code,name').eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function findTopic(id: string): Promise<TopicReference | null> { const { data, error } = await db().from('topics').select('id,subject_id,code,name').eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function fetchSubjectReferences(ids: string[]): Promise<SubjectReference[]> { if (!ids.length) return []; const { data, error } = await db().from('subjects').select('id,code,name').in('id', ids); if (error) failed(); return data; }
export async function fetchTopicReferences(ids: string[]): Promise<TopicReference[]> { if (!ids.length) return []; const { data, error } = await db().from('topics').select('id,subject_id,code,name').in('id', ids); if (error) failed(); return data; }
