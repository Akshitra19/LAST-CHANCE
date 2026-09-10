import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { Tables } from '../types/database.types.js';

export type AnalyticsAttemptRow = Pick<Tables<'attempts'>, 'id' | 'test_id' | 'submitted_at' | 'score' | 'total_time_seconds'>;
export type AnalyticsTestRow = Pick<Tables<'tests'>, 'id' | 'name' | 'test_type' | 'total_marks' | 'duration_minutes'>;
export type AnalyticsAnswerRow = Pick<Tables<'answers'>, 'attempt_id' | 'question_id' | 'submitted_answer' | 'is_correct' | 'marks_awarded' | 'mistake_type' | 'time_seconds'>;
export type AnalyticsQuestionRow = Pick<Tables<'questions'>, 'id' | 'subject_id' | 'question_type' | 'archived'>;
export type AnalyticsLinkRow = Pick<Tables<'test_questions'>, 'test_id' | 'question_id' | 'position'>;
export type AnalyticsSubjectRow = Pick<Tables<'subjects'>, 'id' | 'code' | 'name' | 'display_order'>;
export type AnalyticsTaskRow = Pick<Tables<'daily_tasks'>, 'id' | 'task_date' | 'planned_minutes' | 'actual_minutes' | 'status' | 'subject_id' | 'topic_id'>;
export type AnalyticsTopicRow = Pick<Tables<'topics'>, 'id' | 'subject_id' | 'preparation_status'>;
export type AnalyticsSettingsRow = Pick<Tables<'app_settings'>, 'target_marks' | 'exam_date' | 'exam_name'>;

const pageSize = 500;
function db() { const client = getSupabaseClient(); if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); return client; }
function failed(): never { throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); }
async function pages<T>(load: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await load(from, from + pageSize - 1); if (error || !data) failed();
    rows.push(...data); if (data.length < pageSize) return rows;
  }
}
const chunks = <T>(values: readonly T[], size = 100): T[][] => Array.from({ length: Math.ceil(values.length / size) }, (_, index) => values.slice(index * size, (index + 1) * size));
async function batched<T>(ids: readonly string[], load: (ids: string[], from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (const group of chunks([...new Set(ids)])) rows.push(...await pages((from, to) => load(group, from, to)));
  return rows;
}

export async function fetchAnalyticsAttempts(startInstant: string | null, endInstant: string): Promise<AnalyticsAttemptRow[]> {
  return pages(async (from, to) => {
    let query = db().from('attempts').select('id,test_id,submitted_at,score,total_time_seconds').eq('status', 'SUBMITTED').lt('submitted_at', endInstant);
    if (startInstant) query = query.gte('submitted_at', startInstant);
    const result = await query.order('submitted_at').order('id').range(from, to);
    return { data: result.data as AnalyticsAttemptRow[] | null, error: result.error };
  });
}
export async function fetchAnalyticsTests(ids: string[]): Promise<AnalyticsTestRow[]> {
  if (!ids.length) return [];
  return batched(ids, async (group, from, to) => { const result = await db().from('tests').select('id,name,test_type,total_marks,duration_minutes').in('id', group).order('id').range(from, to); return { data: result.data as AnalyticsTestRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsAnswers(ids: string[]): Promise<AnalyticsAnswerRow[]> {
  if (!ids.length) return [];
  return batched(ids, async (group, from, to) => { const result = await db().from('answers').select('attempt_id,question_id,submitted_answer,is_correct,marks_awarded,mistake_type,time_seconds').in('attempt_id', group).order('attempt_id').order('question_id').range(from, to); return { data: result.data as AnalyticsAnswerRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsLinks(ids: string[]): Promise<AnalyticsLinkRow[]> {
  if (!ids.length) return [];
  return batched(ids, async (group, from, to) => { const result = await db().from('test_questions').select('test_id,question_id,position').in('test_id', group).order('test_id').order('position').range(from, to); return { data: result.data as AnalyticsLinkRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsQuestions(ids: string[]): Promise<AnalyticsQuestionRow[]> {
  if (!ids.length) return [];
  return batched(ids, async (group, from, to) => { const result = await db().from('questions').select('id,subject_id,question_type,archived').in('id', group).order('id').range(from, to); return { data: result.data as AnalyticsQuestionRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsSubjects(): Promise<AnalyticsSubjectRow[]> {
  const { data, error } = await db().from('subjects').select('id,code,name,display_order').eq('syllabus_version', 'GATE_2027').order('display_order').order('code'); if (error) failed(); return data;
}
export async function fetchAnalyticsTasks(startDate: string | null, endDate: string): Promise<AnalyticsTaskRow[]> {
  return pages(async (from, to) => { let query = db().from('daily_tasks').select('id,task_date,planned_minutes,actual_minutes,status,subject_id,topic_id').lte('task_date', endDate); if (startDate) query = query.gte('task_date', startDate); const result = await query.order('task_date').order('id').range(from, to); return { data: result.data as AnalyticsTaskRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsTopics(): Promise<AnalyticsTopicRow[]> {
  return pages(async (from, to) => { const result = await db().from('topics').select('id,subject_id,preparation_status').eq('syllabus_version', 'GATE_2027').order('id').range(from, to); return { data: result.data as AnalyticsTopicRow[] | null, error: result.error }; });
}
export async function fetchAnalyticsSettings(): Promise<AnalyticsSettingsRow> {
  const { data, error } = await db().from('app_settings').select('target_marks,exam_date,exam_name').eq('singleton_key', 'default').single(); if (error || !data) failed(); return data;
}
