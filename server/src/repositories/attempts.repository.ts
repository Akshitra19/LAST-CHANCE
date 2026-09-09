import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { Json, Tables, TablesInsert, TablesUpdate } from '../types/database.types.js';

export type AttemptRow = Tables<'attempts'>;
export type AnswerRow = Tables<'answers'>;
export type AttemptTestRow = Pick<Tables<'tests'>, 'id' | 'name' | 'test_type' | 'duration_minutes' | 'total_marks'>;
export type AttemptQuestionRow = Pick<Tables<'questions'>, 'id' | 'subject_id' | 'topic_id' | 'question_text' | 'question_type' | 'marks' | 'image_path'>;
export type AttemptOptionRow = Pick<Tables<'question_options'>, 'question_id' | 'option_key' | 'option_text' | 'display_order'>;
export type AttemptLinkRow = Pick<Tables<'test_questions'>, 'test_id' | 'question_id' | 'position'>;
export type AttemptRefRow = Pick<Tables<'subjects'>, 'id' | 'code' | 'name'>;
export type ScoringQuestionRow = Pick<Tables<'questions'>, 'id' | 'question_type' | 'marks' | 'correct_answer'>;
export type ScoringOptionRow = Pick<Tables<'question_options'>, 'question_id' | 'option_key' | 'display_order'>;

const attemptColumns = 'id,test_id,status,started_at,submitted_at,score,total_time_seconds,created_at,updated_at';
const answerColumns = 'id,attempt_id,question_id,submitted_answer,marked_for_review,time_seconds,created_at,updated_at';
const safeQuestionColumns = 'id,subject_id,topic_id,question_text,question_type,marks,image_path';
function db() { const client = getSupabaseClient(); if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); return client; }
function failed(): never { throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.'); }

export async function findActiveAttempt(testId: string): Promise<AttemptRow | null> { const { data, error } = await db().from('attempts').select(attemptColumns).eq('test_id', testId).eq('status', 'IN_PROGRESS').order('started_at', { ascending: false }).limit(1).maybeSingle(); if (error) failed(); return data; }
export async function findAttemptRow(id: string): Promise<AttemptRow | null> { const { data, error } = await db().from('attempts').select(attemptColumns).eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function findAttemptTest(id: string): Promise<AttemptTestRow | null> { const { data, error } = await db().from('tests').select('id,name,test_type,duration_minutes,total_marks').eq('id', id).maybeSingle(); if (error) failed(); return data; }
export async function findAttemptLinks(testId: string): Promise<AttemptLinkRow[]> { const { data, error } = await db().from('test_questions').select('test_id,question_id,position').eq('test_id', testId).order('position'); if (error) failed(); return data; }
export async function findAttemptQuestions(ids: string[]): Promise<AttemptQuestionRow[]> { if (!ids.length) return []; const { data, error } = await db().from('questions').select(safeQuestionColumns).in('id', ids); if (error) failed(); return data; }
export async function findAttemptOptions(ids: string[]): Promise<AttemptOptionRow[]> { if (!ids.length) return []; const { data, error } = await db().from('question_options').select('question_id,option_key,option_text,display_order').in('question_id', ids).order('display_order'); if (error) failed(); return data; }
export async function findAttemptRefs(subjectIds: string[], topicIds: string[]): Promise<{ subjects: AttemptRefRow[]; topics: AttemptRefRow[] }> { const [subjects, topics] = await Promise.all([subjectIds.length ? db().from('subjects').select('id,code,name').in('id', subjectIds) : Promise.resolve({ data: [] as AttemptRefRow[], error: null }), topicIds.length ? db().from('topics').select('id,code,name').in('id', topicIds) : Promise.resolve({ data: [] as AttemptRefRow[], error: null })]); if (subjects.error || topics.error) failed(); return { subjects: subjects.data, topics: topics.data }; }
export async function findAttemptAnswers(attemptId: string): Promise<AnswerRow[]> { const { data, error } = await db().from('answers').select(answerColumns).eq('attempt_id', attemptId); if (error) failed(); return data as AnswerRow[]; }
export async function findScoringQuestions(ids: string[]): Promise<ScoringQuestionRow[]> { if (!ids.length) return []; const { data, error } = await db().from('questions').select('id,question_type,marks,correct_answer').in('id', ids); if (error) failed(); return data; }
export async function findScoringOptions(ids: string[]): Promise<ScoringOptionRow[]> { if (!ids.length) return []; const { data, error } = await db().from('question_options').select('question_id,option_key,display_order').in('question_id', ids).order('display_order'); if (error) failed(); return data; }
export async function findAttemptAnswer(attemptId: string, questionId: string): Promise<AnswerRow | null> { const { data, error } = await db().from('answers').select(answerColumns).eq('attempt_id', attemptId).eq('question_id', questionId).maybeSingle(); if (error) failed(); return data as AnswerRow | null; }
export async function createAttemptRow(input: TablesInsert<'attempts'>): Promise<AttemptRow> { const { data, error } = await db().from('attempts').insert(input).select(attemptColumns).single(); if (error) failed(); return data; }
export async function insertAttemptAnswers(input: TablesInsert<'answers'>[]): Promise<void> { const { error } = await db().from('answers').insert(input); if (error) failed(); }
export async function updateAttemptAnswer(id: string, input: TablesUpdate<'answers'> & { time_seconds: number }): Promise<AnswerRow | null> { const { data, error } = await db().from('answers').update(input).eq('id', id).lte('time_seconds', input.time_seconds).select(answerColumns).maybeSingle(); if (error) failed(); return data as AnswerRow | null; }
export async function submitAttemptRow(id: string, submittedAt: string, totalTimeSeconds: number): Promise<AttemptRow | null> { const { data, error } = await db().from('attempts').update({ status: 'SUBMITTED', submitted_at: submittedAt, total_time_seconds: totalTimeSeconds, score: null, updated_at: new Date().toISOString() }).eq('id', id).eq('status', 'IN_PROGRESS').select(attemptColumns).maybeSingle(); if (error) failed(); return data; }
export async function updateAnswerScoring(id: string, isCorrect: boolean | null, marksAwarded: number): Promise<boolean> { const { data, error } = await db().from('answers').update({ is_correct: isCorrect, marks_awarded: marksAwarded }).eq('id', id).select('id').maybeSingle(); if (error) failed(); return Boolean(data); }
export async function updateAttemptScore(id: string, score: number): Promise<AttemptRow | null> { const { data, error } = await db().from('attempts').update({ score }).eq('id', id).eq('status', 'SUBMITTED').select(attemptColumns).maybeSingle(); if (error) failed(); return data; }
export async function deleteAttemptRow(id: string): Promise<void> { const { error } = await db().from('attempts').delete().eq('id', id); if (error) failed(); }

export async function countAttemptAnswers(id: string): Promise<number> { const { count, error } = await db().from('answers').select('id', { count: 'exact', head: true }).eq('attempt_id', id); if (error) failed(); return count ?? 0; }
export async function countActiveAttempts(testId: string): Promise<number> { const { count, error } = await db().from('attempts').select('id', { count: 'exact', head: true }).eq('test_id', testId).eq('status', 'IN_PROGRESS'); if (error) failed(); return count ?? 0; }
export async function findAnswerScoringState(attemptId: string): Promise<Array<{ id: string; question_id: string; submitted_answer: Json; is_correct: boolean | null; marks_awarded: number | null; time_seconds: number; marked_for_review: boolean; created_at: string; updated_at: string }>> { const { data, error } = await db().from('answers').select('id,question_id,submitted_answer,is_correct,marks_awarded,time_seconds,marked_for_review,created_at,updated_at').eq('attempt_id', attemptId); if (error) failed(); return data; }
export async function backdateAttemptForVerification(id: string, startedAt: string): Promise<void> { const { error } = await db().from('attempts').update({ started_at: startedAt, updated_at: new Date().toISOString() }).eq('id', id); if (error) failed(); }
