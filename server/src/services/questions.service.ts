import { AppError } from '../errors/app-error.js';
import { createQuestionRow, deleteQuestionOptions, deleteQuestionRowForCleanup, fetchQuestionRefs, findQuestionOptions, findQuestionRow, findSubjectRef, findTopicRef, insertQuestionOptions, listQuestionRows, updateQuestionRow, type QuestionOptionRow, type QuestionRow, type SubjectRef, type TopicRef } from '../repositories/questions.repository.js';
import { questionHasAttempts } from '../repositories/tests.repository.js';
import type { Json, TablesInsert, TablesUpdate } from '../types/database.types.js';
import { desiredQuestionSchema, type CreateQuestion, type DesiredQuestion, type QuestionListQuery, type UpdateQuestion } from '../validation/questions.schemas.js';

function nullableText(value: string | null | undefined): string | null { return value == null || value.trim() === '' ? null : value.trim(); }
function parseDesired(value: unknown): DesiredQuestion { const parsed = desiredQuestionSchema.safeParse(value); if (!parsed.success) throw new AppError(400, 'QUESTION_STATE_INVALID', 'Question answer or options are invalid.'); return parsed.data; }
function ref(value: SubjectRef | TopicRef | undefined) { return value ? { id: value.id, code: value.code, name: value.name } : null; }
function normalizeAnswer(question: DesiredQuestion) {
  if ('min' in question.correctAnswer) return { min: question.correctAnswer.min, max: question.correctAnswer.max };
  const order = new Map(question.options.map((option, index) => [option.key, index]));
  return { optionKeys: [...question.correctAnswer.optionKeys].sort((left, right) => order.get(left)! - order.get(right)!) };
}
function optionInputs(id: string, options: DesiredQuestion['options']): TablesInsert<'question_options'>[] { const now = new Date().toISOString(); return options.map((option, index) => ({ question_id: id, option_key: option.key, option_text: option.text.trim(), display_order: index + 1, updated_at: now })); }
function questionInput(question: DesiredQuestion): TablesInsert<'questions'> { return { subject_id: question.subjectId, topic_id: question.topicId, question_text: question.questionText.trim(), question_type: question.questionType, marks: question.marks, difficulty: question.difficulty ?? null, year: question.year ?? null, source: nullableText(question.source), correct_answer: normalizeAnswer(question) as Json, explanation: nullableText(question.explanation), archived: false, archived_at: null, image_path: null, updated_at: new Date().toISOString() }; }
function questionUpdate(question: DesiredQuestion, archived: boolean, archivedAt: string | null, imagePath?: string | null): TablesUpdate<'questions'> { return { subject_id: question.subjectId, topic_id: question.topicId, question_text: question.questionText.trim(), question_type: question.questionType, marks: question.marks, difficulty: question.difficulty ?? null, year: question.year ?? null, source: nullableText(question.source), correct_answer: normalizeAnswer(question) as Json, explanation: nullableText(question.explanation), archived, archived_at: archivedAt, ...(imagePath !== undefined ? { image_path: imagePath } : {}), updated_at: new Date().toISOString() }; }
function snapshotUpdate(row: QuestionRow): TablesUpdate<'questions'> { return { subject_id: row.subject_id, topic_id: row.topic_id, question_text: row.question_text, question_type: row.question_type, marks: row.marks, difficulty: row.difficulty, year: row.year, source: row.source, correct_answer: row.correct_answer, explanation: row.explanation, image_path: row.image_path, archived: row.archived, archived_at: row.archived_at, updated_at: row.updated_at }; }

async function validateReferences(subjectId: string, topicId: string): Promise<void> { const [subject, topic] = await Promise.all([findSubjectRef(subjectId), findTopicRef(topicId)]); if (!subject) throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject was not found.'); if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic was not found.'); if (topic.subject_id !== subject.id) throw new AppError(400, 'TOPIC_SUBJECT_MISMATCH', 'Topic does not belong to the selected subject.'); }
async function maps(rows: QuestionRow[]) { const subjectIds = [...new Set(rows.map((row) => row.subject_id))]; const topicIds = [...new Set(rows.map((row) => row.topic_id))]; const refs = await fetchQuestionRefs(subjectIds, topicIds); return { subjects: new Map(refs.subjects.map((value) => [value.id, value])), topics: new Map(refs.topics.map((value) => [value.id, value])) }; }
function listItem(row: QuestionRow, subjects: Map<string, SubjectRef>, topics: Map<string, TopicRef>) { return { id: row.id, questionText: row.question_text, questionType: row.question_type, marks: row.marks, difficulty: row.difficulty, year: row.year, source: row.source, subject: ref(subjects.get(row.subject_id)), topic: ref(topics.get(row.topic_id)), hasImage: Boolean(row.image_path), archived: row.archived, createdAt: row.created_at, updatedAt: row.updated_at }; }
async function detail(row: QuestionRow, options?: QuestionOptionRow[]) { const references = await maps([row]); const ordered = options ?? await findQuestionOptions(row.id); return { ...listItem(row, references.subjects, references.topics), correctAnswer: row.correct_answer, explanation: row.explanation, options: ordered.map((option) => ({ key: option.option_key, text: option.option_text })), archivedAt: row.archived_at } ; }

export async function listQuestions(query: QuestionListQuery) {
  if (query.subjectId && !(await findSubjectRef(query.subjectId))) throw new AppError(404, 'SUBJECT_NOT_FOUND', 'Subject was not found.');
  if (query.topicId) { const topic = await findTopicRef(query.topicId); if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic was not found.'); if (query.subjectId && topic.subject_id !== query.subjectId) throw new AppError(400, 'TOPIC_SUBJECT_MISMATCH', 'Topic does not belong to the selected subject.'); }
  const result = await listQuestionRows(query); const references = await maps(result.rows); return { items: result.rows.map((row) => listItem(row, references.subjects, references.topics)), page: query.page, pageSize: query.pageSize, total: result.total, totalPages: Math.ceil(result.total / query.pageSize) };
}
export async function getQuestion(id: string) { const row = await findQuestionRow(id); if (!row) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.'); return detail(row); }

export async function createQuestion(input: CreateQuestion) {
  const desired = parseDesired(input); await validateReferences(desired.subjectId, desired.topicId);
  let created: QuestionRow | null = null;
  try { created = await createQuestionRow(questionInput(desired)); const options = await insertQuestionOptions(optionInputs(created.id, desired.options)); return detail(created, options); }
  catch (error) { if (created) { try { await deleteQuestionRowForCleanup(created.id); if (await findQuestionRow(created.id)) throw new Error('Create cleanup verification failed.'); } catch { console.error('Question create cleanup failed.'); throw new AppError(500, 'QUESTION_CLEANUP_FAILED', 'Question creation could not be safely completed.'); } } throw error; }
}

function currentDesired(row: QuestionRow, options: QuestionOptionRow[]): DesiredQuestion { return desiredQuestionSchema.parse({ subjectId: row.subject_id, topicId: row.topic_id, questionText: row.question_text, questionType: row.question_type, marks: row.marks, difficulty: row.difficulty, year: row.year, source: row.source, explanation: row.explanation, options: options.map((option) => ({ key: option.option_key, text: option.option_text })), correctAnswer: row.correct_answer }); }
export async function updateQuestion(id: string, input: UpdateQuestion) {
  const row = await findQuestionRow(id); if (!row) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.'); const oldOptions = await findQuestionOptions(id); const current = currentDesired(row, oldOptions);
  const { archived: archiveChange, ...contentInput } = input;
  if (Object.keys(contentInput).length > 0 && await questionHasAttempts(id)) throw new AppError(409, 'QUESTION_LOCKED_BY_ATTEMPT', 'This question belongs to an attempted test and its content can no longer be edited.');
  const nextType = contentInput.questionType ?? current.questionType;
  const nextOptions = contentInput.options ?? (nextType === 'NAT' ? [] : current.options);
  const desired = parseDesired({ ...current, ...contentInput, questionType: nextType, options: nextOptions, correctAnswer: contentInput.correctAnswer ?? current.correctAnswer });
  await validateReferences(desired.subjectId, desired.topicId);
  const archived = archiveChange ?? row.archived; const archivedAt = archiveChange === true ? new Date().toISOString() : archiveChange === false ? null : row.archived_at;
  const replaceOptions = contentInput.options !== undefined || desired.questionType !== current.questionType;
  try {
    const saved = await updateQuestionRow(id, questionUpdate(desired, archived, archivedAt)); if (!saved) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.');
    let options = oldOptions;
    if (replaceOptions) { await deleteQuestionOptions(id); options = await insertQuestionOptions(optionInputs(id, desired.options)); }
    return detail(saved, options);
  } catch (error) {
    try { await updateQuestionRow(id, snapshotUpdate(row)); await deleteQuestionOptions(id); await insertQuestionOptions(oldOptions.map((option) => ({ question_id: id, option_key: option.option_key, option_text: option.option_text, display_order: option.display_order, created_at: option.created_at, updated_at: option.updated_at }))); }
    catch { console.error('Question update rollback failed.'); throw new AppError(500, 'QUESTION_ROLLBACK_FAILED', 'Question update could not be safely completed.'); }
    throw error;
  }
}

export async function setQuestionImagePath(id: string, imagePath: string | null): Promise<QuestionRow> { const existing = await findQuestionRow(id); if (!existing) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.'); const saved = await updateQuestionRow(id, { image_path: imagePath, updated_at: new Date().toISOString() }); if (!saved) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.'); return saved; }
export async function getQuestionRowForImage(id: string): Promise<QuestionRow> { const row = await findQuestionRow(id); if (!row) throw new AppError(404, 'QUESTION_NOT_FOUND', 'Question was not found.'); return row; }
export async function assertQuestionContentMutable(id: string): Promise<void> { if (await questionHasAttempts(id)) throw new AppError(409, 'QUESTION_LOCKED_BY_ATTEMPT', 'This question belongs to an attempted test and its content can no longer be edited.'); }
