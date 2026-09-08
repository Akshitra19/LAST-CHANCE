import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types.js';
import type { QuestionListQuery } from '../validation/questions.schemas.js';

export type QuestionRow = Tables<'questions'>;
export type QuestionOptionRow = Tables<'question_options'>;
export type SubjectRef = Pick<Tables<'subjects'>, 'id' | 'code' | 'name'>;
export type TopicRef = Pick<Tables<'topics'>, 'id' | 'subject_id' | 'code' | 'name'>;
const questionColumns = 'id,subject_id,topic_id,question_text,question_type,marks,difficulty,year,source,correct_answer,explanation,image_path,archived,archived_at,created_at,updated_at';

function db() { const client = getSupabaseClient(); if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); return client; }
function failed(): never { throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); }

export async function listQuestionRows(query: QuestionListQuery): Promise<{ rows: QuestionRow[]; total: number }> {
  const from = (query.page - 1) * query.pageSize; const to = from + query.pageSize - 1;
  let request = db().from('questions').select(questionColumns, { count: 'exact' }).eq('archived', query.archived);
  if (query.subjectId) request = request.eq('subject_id', query.subjectId);
  if (query.topicId) request = request.eq('topic_id', query.topicId);
  if (query.questionType) request = request.eq('question_type', query.questionType);
  if (query.marks) request = request.eq('marks', query.marks);
  if (query.difficulty) request = request.eq('difficulty', query.difficulty);
  if (query.year) request = request.eq('year', query.year);
  const { data, error, count } = await request.order('created_at', { ascending: false }).order('id', { ascending: false }).range(from, to);
  if (error) failed(); return { rows: data, total: count ?? 0 };
}
export async function findQuestionRow(id: string): Promise<QuestionRow | null> { const { data, error } = await db().from('questions').select(questionColumns).eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function findQuestionOptions(id: string): Promise<QuestionOptionRow[]> { const { data, error } = await db().from('question_options').select('id,question_id,option_key,option_text,display_order,created_at,updated_at').eq('question_id', id).order('display_order'); if (error) failed(); return data; }
export async function createQuestionRow(input: TablesInsert<'questions'>): Promise<QuestionRow> { const { data, error } = await db().from('questions').insert(input).select(questionColumns).single(); if (error) failed(); return data; }
export async function updateQuestionRow(id: string, input: TablesUpdate<'questions'>): Promise<QuestionRow | null> { const { data, error } = await db().from('questions').update(input).eq('id', id).select(questionColumns).maybeSingle(); if (error) failed(); return data; }
export async function insertQuestionOptions(input: TablesInsert<'question_options'>[]): Promise<QuestionOptionRow[]> { if (!input.length) return []; const { data, error } = await db().from('question_options').insert(input).select('id,question_id,option_key,option_text,display_order,created_at,updated_at'); if (error) failed(); return data; }
export async function deleteQuestionOptions(id: string): Promise<void> { const { error } = await db().from('question_options').delete().eq('question_id', id); if (error) failed(); }
export async function deleteQuestionRowForCleanup(id: string): Promise<void> { const { error } = await db().from('questions').delete().eq('id', id); if (error) failed(); }
export async function fetchQuestionRefs(subjectIds: string[], topicIds: string[]): Promise<{ subjects: SubjectRef[]; topics: TopicRef[] }> {
  const [subjectsResult, topicsResult] = await Promise.all([
    subjectIds.length ? db().from('subjects').select('id,code,name').in('id', subjectIds) : Promise.resolve({ data: [] as SubjectRef[], error: null }),
    topicIds.length ? db().from('topics').select('id,subject_id,code,name').in('id', topicIds) : Promise.resolve({ data: [] as TopicRef[], error: null })
  ]);
  if (subjectsResult.error || topicsResult.error) failed(); return { subjects: subjectsResult.data, topics: topicsResult.data };
}
export async function findSubjectRef(id: string): Promise<SubjectRef | null> { const { data, error } = await db().from('subjects').select('id,code,name').eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function findTopicRef(id: string): Promise<TopicRef | null> { const { data, error } = await db().from('topics').select('id,subject_id,code,name').eq('id', id).maybeSingle(); if (error) failed(); return data; }
