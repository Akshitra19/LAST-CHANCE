import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { MistakeType } from '../domain/results.js';
import type { Tables } from '../types/database.types.js';
import type { ListResultsQuery } from '../validation/results.schemas.js';

export type ResultAttemptRow = Pick<Tables<'attempts'>, 'id' | 'test_id' | 'status' | 'submitted_at' | 'score' | 'total_time_seconds'>;
export type ResultTestRow = Pick<Tables<'tests'>, 'id' | 'name' | 'test_type' | 'total_marks'>;
export type ResultLinkRow = Pick<Tables<'test_questions'>, 'test_id' | 'question_id' | 'position'>;
export type ResultAnswerRow = Pick<Tables<'answers'>, 'id' | 'attempt_id' | 'question_id' | 'submitted_answer' | 'is_correct' | 'marks_awarded' | 'time_seconds' | 'marked_for_review' | 'mistake_type'>;
export type ResultQuestionRow = Pick<Tables<'questions'>, 'id' | 'subject_id' | 'topic_id' | 'question_text' | 'question_type' | 'marks' | 'correct_answer' | 'explanation' | 'image_path' | 'archived'>;
export type ResultOptionRow = Pick<Tables<'question_options'>, 'question_id' | 'option_key' | 'option_text' | 'display_order'>;
export type ResultSubjectRow = Pick<Tables<'subjects'>, 'id' | 'code' | 'name' | 'display_order'>;
export type ResultTopicRow = Pick<Tables<'topics'>, 'id' | 'code' | 'name'>;

const attemptColumns = 'id,test_id,status,submitted_at,score,total_time_seconds';
const answerColumns = 'id,attempt_id,question_id,submitted_answer,is_correct,marks_awarded,time_seconds,marked_for_review,mistake_type';
const questionColumns = 'id,subject_id,topic_id,question_text,question_type,marks,correct_answer,explanation,image_path,archived';

function db() {
  const client = getSupabaseClient();
  if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return client;
}

function failed(): never {
  throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
}

export async function listSubmittedAttemptRows(query: ListResultsQuery): Promise<{ rows: ResultAttemptRow[]; total: number }> {
  let allowedTestIds: string[] | undefined;
  if (query.testType) {
    const testResult = await db().from('tests').select('id').eq('test_type', query.testType);
    if (testResult.error) failed();
    allowedTestIds = testResult.data.map((row) => row.id);
    if (query.testId && !allowedTestIds.includes(query.testId)) return { rows: [], total: 0 };
    if (!query.testId && allowedTestIds.length === 0) return { rows: [], total: 0 };
  }
  const from = (query.page - 1) * query.pageSize;
  let request = db().from('attempts').select(attemptColumns, { count: 'exact' }).eq('status', 'SUBMITTED');
  if (query.testId) request = request.eq('test_id', query.testId);
  else if (allowedTestIds) request = request.in('test_id', allowedTestIds);
  const { data, error, count } = await request
    .order('submitted_at', { ascending: false })
    .order('id', { ascending: false })
    .range(from, from + query.pageSize - 1);
  if (error) failed();
  return { rows: data, total: count ?? 0 };
}

export async function findResultAttempt(id: string): Promise<ResultAttemptRow | null> {
  const { data, error } = await db().from('attempts').select(attemptColumns).eq('id', id).maybeSingle();
  if (error) failed();
  return data;
}

export async function findResultAttempts(ids?: string[]): Promise<ResultAttemptRow[]> {
  if (ids && ids.length === 0) return [];
  let request = db().from('attempts').select(attemptColumns).eq('status', 'SUBMITTED');
  if (ids) request = request.in('id', ids);
  const { data, error } = await request.order('submitted_at', { ascending: false }).order('id', { ascending: false });
  if (error) failed();
  return data;
}

export async function findResultTests(ids: string[]): Promise<ResultTestRow[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from('tests').select('id,name,test_type,total_marks').in('id', ids);
  if (error) failed();
  return data;
}

export async function findResultLinks(testIds: string[]): Promise<ResultLinkRow[]> {
  if (!testIds.length) return [];
  const { data, error } = await db().from('test_questions').select('test_id,question_id,position').in('test_id', testIds).order('position');
  if (error) failed();
  return data;
}

export async function findResultAnswers(attemptIds: string[]): Promise<ResultAnswerRow[]> {
  if (!attemptIds.length) return [];
  const { data, error } = await db().from('answers').select(answerColumns).in('attempt_id', attemptIds);
  if (error) failed();
  return data;
}

export async function findMistakeCandidateAnswers(): Promise<ResultAnswerRow[]> {
  const { data, error } = await db().from('answers').select(answerColumns)
    .not('marks_awarded', 'is', null)
    .or('is_correct.eq.false,is_correct.is.null');
  if (error) failed();
  return data;
}

export async function findResultQuestions(ids: string[]): Promise<ResultQuestionRow[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from('questions').select(questionColumns).in('id', ids);
  if (error) failed();
  return data;
}

export async function findResultOptions(ids: string[]): Promise<ResultOptionRow[]> {
  if (!ids.length) return [];
  const { data, error } = await db().from('question_options').select('question_id,option_key,option_text,display_order').in('question_id', ids).order('display_order');
  if (error) failed();
  return data;
}

export async function findResultReferences(subjectIds: string[], topicIds: string[]): Promise<{ subjects: ResultSubjectRow[]; topics: ResultTopicRow[] }> {
  const [subjects, topics] = await Promise.all([
    subjectIds.length ? db().from('subjects').select('id,code,name,display_order').in('id', subjectIds).order('display_order') : Promise.resolve({ data: [] as ResultSubjectRow[], error: null }),
    topicIds.length ? db().from('topics').select('id,code,name').in('id', topicIds) : Promise.resolve({ data: [] as ResultTopicRow[], error: null })
  ]);
  if (subjects.error || topics.error) failed();
  return { subjects: subjects.data, topics: topics.data };
}

export async function updateResultMistakeType(attemptId: string, questionId: string, mistakeType: MistakeType | null): Promise<ResultAnswerRow | null> {
  const { data, error } = await db().from('answers').update({ mistake_type: mistakeType })
    .eq('attempt_id', attemptId).eq('question_id', questionId).select(answerColumns).maybeSingle();
  if (error) failed();
  return data;
}
