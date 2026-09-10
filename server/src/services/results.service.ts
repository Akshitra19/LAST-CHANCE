import { classifyResultAnswer, ResultIntegrityError, summarizeOutcomes, type MistakeType, type ResultOutcome } from '../domain/results.js';
import { AppError } from '../errors/app-error.js';
import {
  findMistakeCandidateAnswers,
  findResultAnswers,
  findResultAttempt,
  findResultAttempts,
  findResultLinks,
  findResultOptions,
  findResultQuestions,
  findResultReferences,
  findResultTests,
  listSubmittedAttemptRows,
  updateResultMistakeType,
  type ResultAnswerRow,
  type ResultAttemptRow,
  type ResultQuestionRow
} from '../repositories/results.repository.js';
import { ensureAttemptScored } from './scoring.service.js';
import type { ListMistakesQuery, ListResultsQuery } from '../validation/results.schemas.js';

function integrity(message: string): never {
  throw new AppError(409, 'RESULT_INTEGRITY_ERROR', message);
}

function outcome(question: ResultQuestionRow, answer: ResultAnswerRow): ResultOutcome {
  try {
    return classifyResultAnswer({
      questionType: question.question_type,
      submittedAnswer: answer.submitted_answer,
      isCorrect: answer.is_correct,
      marksAwarded: answer.marks_awarded,
      mistakeType: answer.mistake_type
    });
  } catch (error) {
    if (error instanceof ResultIntegrityError) integrity(error.message);
    throw error;
  }
}

function requireSubmitted(attempt: ResultAttemptRow): void {
  if (attempt.status !== 'SUBMITTED') throw new AppError(409, 'RESULT_NOT_READY', 'Results are available only after submission.');
  if (!attempt.submitted_at) integrity('Submitted attempt has no submission timestamp.');
}

async function ensureScored(attempt: ResultAttemptRow): Promise<ResultAttemptRow> {
  requireSubmitted(attempt);
  if (attempt.score !== null) return attempt;
  await ensureAttemptScored(attempt.id);
  const refreshed = await findResultAttempt(attempt.id);
  if (!refreshed || refreshed.score === null) integrity('Submitted attempt could not be scored.');
  return refreshed;
}

function ref(value: { id: string; code: string; name: string } | undefined) {
  if (!value) integrity('A result subject or topic is missing.');
  return { id: value.id, code: value.code, name: value.name };
}

export async function listResults(query: ListResultsQuery) {
  const listed = await listSubmittedAttemptRows(query);
  const attempts = await Promise.all(listed.rows.map(ensureScored));
  const tests = await findResultTests([...new Set(attempts.map((row) => row.test_id))]);
  const links = await findResultLinks([...new Set(attempts.map((row) => row.test_id))]);
  const answers = await findResultAnswers(attempts.map((row) => row.id));
  const questions = await findResultQuestions([...new Set(answers.map((row) => row.question_id))]);
  const testById = new Map(tests.map((row) => [row.id, row]));
  const questionById = new Map(questions.map((row) => [row.id, row]));
  const answersByAttempt = new Map<string, ResultAnswerRow[]>();
  const questionIdsByTest = new Map<string, string[]>();
  for (const link of links) {
    const values = questionIdsByTest.get(link.test_id) ?? [];
    values.push(link.question_id);
    questionIdsByTest.set(link.test_id, values);
  }
  for (const answer of answers) {
    const values = answersByAttempt.get(answer.attempt_id) ?? [];
    values.push(answer);
    answersByAttempt.set(answer.attempt_id, values);
  }
  const items = attempts.map((attempt) => {
    const test = testById.get(attempt.test_id);
    if (!test || attempt.score === null || !attempt.submitted_at) integrity('Result history source is incomplete.');
    const attemptAnswers = answersByAttempt.get(attempt.id) ?? [];
    const expectedIds = questionIdsByTest.get(test.id) ?? [];
    if (!expectedIds.length || attemptAnswers.length !== expectedIds.length ||
        new Set(expectedIds).size !== expectedIds.length ||
        new Set(attemptAnswers.map((answer) => answer.question_id)).size !== attemptAnswers.length ||
        attemptAnswers.some((answer) => !expectedIds.includes(answer.question_id))) {
      integrity('Result history answers do not match the saved test.');
    }
    const outcomes = attemptAnswers.map((answer) => {
      const question = questionById.get(answer.question_id);
      if (!question) integrity('Result history question is missing.');
      return outcome(question, answer);
    });
    const counts = summarizeOutcomes(outcomes);
    return {
      attemptId: attempt.id,
      testId: test.id,
      testName: test.name,
      testType: test.test_type,
      submittedAt: attempt.submitted_at,
      score: attempt.score,
      totalMarks: test.total_marks ?? 0,
      ...counts,
      totalTimeSeconds: attempt.total_time_seconds ?? 0
    };
  });
  return { items, page: query.page, pageSize: query.pageSize, total: listed.total, totalPages: Math.ceil(listed.total / query.pageSize) };
}

export async function getResult(attemptId: string) {
  const found = await findResultAttempt(attemptId);
  if (!found) throw new AppError(404, 'RESULT_NOT_FOUND', 'Result was not found.');
  requireSubmitted(found);
  const attempt = await ensureScored(found);
  const tests = await findResultTests([attempt.test_id]);
  const links = await findResultLinks([attempt.test_id]);
  const answers = await findResultAnswers([attempt.id]);
  const questionIds = links.map((link) => link.question_id);
  const questions = await findResultQuestions(questionIds);
  if (tests.length !== 1 || links.length === 0 || answers.length !== links.length || questions.length !== links.length ||
      new Set(questionIds).size !== links.length || links.some((link, index) => link.position !== index + 1)) {
    integrity('Result detail source is incomplete.');
  }
  const expected = new Set(questionIds);
  if (answers.some((answer) => !expected.has(answer.question_id)) || new Set(answers.map((answer) => answer.question_id)).size !== answers.length) {
    integrity('Result answers do not match the saved test.');
  }
  const [options, references] = await Promise.all([
    findResultOptions(questionIds),
    findResultReferences([...new Set(questions.map((row) => row.subject_id))], [...new Set(questions.map((row) => row.topic_id))])
  ]);
  const test = tests[0]!;
  const questionById = new Map(questions.map((row) => [row.id, row]));
  const answerByQuestion = new Map(answers.map((row) => [row.question_id, row]));
  const subjectById = new Map(references.subjects.map((row) => [row.id, row]));
  const topicById = new Map(references.topics.map((row) => [row.id, row]));
  const optionByQuestion = new Map<string, Array<{ key: string; text: string }>>();
  for (const option of options) {
    const values = optionByQuestion.get(option.question_id) ?? [];
    values.push({ key: option.option_key, text: option.option_text });
    optionByQuestion.set(option.question_id, values);
  }
  const review = links.map((link) => {
    const question = questionById.get(link.question_id);
    const answer = answerByQuestion.get(link.question_id);
    if (!question || !answer) integrity('Result question or answer is missing.');
    const resultOutcome = outcome(question, answer);
    return {
      questionId: question.id,
      position: link.position,
      questionText: question.question_text,
      questionType: question.question_type,
      marks: question.marks,
      subject: ref(subjectById.get(question.subject_id)),
      topic: ref(topicById.get(question.topic_id)),
      options: question.question_type === 'NAT' ? [] : optionByQuestion.get(question.id) ?? [],
      hasImage: Boolean(question.image_path),
      submittedAnswer: answer.submitted_answer,
      correctAnswer: question.correct_answer,
      outcome: resultOutcome,
      isCorrect: answer.is_correct,
      marksAwarded: answer.marks_awarded!,
      explanation: question.explanation,
      timeSeconds: answer.time_seconds,
      markedForReview: answer.marked_for_review,
      mistakeType: answer.mistake_type as MistakeType | null,
      retryEligible: !question.archived
    };
  });
  const counts = summarizeOutcomes(review.map((item) => item.outcome));
  const subjectBreakdown = references.subjects.flatMap((subject) => {
    const subjectItems = review.filter((item) => item.subject.id === subject.id);
    if (!subjectItems.length) return [];
    return [{ subjectId: subject.id, subjectName: subject.name, ...summarizeOutcomes(subjectItems.map((item) => item.outcome)), timeSeconds: subjectItems.reduce((sum, item) => sum + item.timeSeconds, 0) }];
  });
  if (attempt.score === null || !attempt.submitted_at) integrity('Result summary is incomplete.');
  return {
    attemptId: attempt.id,
    testId: test.id,
    testName: test.name,
    testType: test.test_type,
    submittedAt: attempt.submitted_at,
    score: attempt.score,
    totalMarks: test.total_marks ?? 0,
    ...counts,
    totalTimeSeconds: attempt.total_time_seconds ?? 0,
    subjectBreakdown,
    questions: review
  };
}

export async function updateMistakeType(attemptId: string, questionId: string, mistakeType: MistakeType | null) {
  const result = await getResult(attemptId);
  const question = result.questions.find((item) => item.questionId === questionId);
  if (!question) throw new AppError(404, 'RESULT_QUESTION_NOT_FOUND', 'The question is not part of this result.');
  if (question.outcome === 'CORRECT') throw new AppError(409, 'MISTAKE_NOT_APPLICABLE', 'Correct answers cannot be classified as mistakes.');
  const saved = await updateResultMistakeType(attemptId, questionId, mistakeType);
  if (!saved) throw new AppError(404, 'RESULT_QUESTION_NOT_FOUND', 'The result answer was not found.');
  return { attemptId, questionId, outcome: question.outcome, mistakeType: saved.mistake_type as MistakeType | null };
}

export async function listMistakes(query: ListMistakesQuery) {
  const attempts = await Promise.all((await findResultAttempts()).map(ensureScored));
  const candidates = await findMistakeCandidateAnswers();
  const attemptById = new Map(attempts.map((row) => [row.id, row]));
  const eligibleAnswers = candidates.filter((answer) => attemptById.has(answer.attempt_id));
  const tests = await findResultTests([...new Set(attempts.map((row) => row.test_id))]);
  const questions = await findResultQuestions([...new Set(eligibleAnswers.map((row) => row.question_id))]);
  const [options, references] = await Promise.all([
    findResultOptions(questions.map((row) => row.id)),
    findResultReferences([...new Set(questions.map((row) => row.subject_id))], [...new Set(questions.map((row) => row.topic_id))])
  ]);
  const testById = new Map(tests.map((row) => [row.id, row]));
  const questionById = new Map(questions.map((row) => [row.id, row]));
  const subjectById = new Map(references.subjects.map((row) => [row.id, row]));
  const topicById = new Map(references.topics.map((row) => [row.id, row]));
  const optionByQuestion = new Map<string, Array<{ key: string; text: string }>>();
  for (const option of options) {
    const values = optionByQuestion.get(option.question_id) ?? [];
    values.push({ key: option.option_key, text: option.option_text });
    optionByQuestion.set(option.question_id, values);
  }
  const mapped = eligibleAnswers.map((answer) => {
    const attempt = attemptById.get(answer.attempt_id);
    const question = questionById.get(answer.question_id);
    const test = attempt ? testById.get(attempt.test_id) : undefined;
    if (!attempt || !question || !test || !attempt.submitted_at) integrity('Mistake history source is incomplete.');
    const resultOutcome = outcome(question, answer);
    if (resultOutcome === 'CORRECT') integrity('Correct answer appeared in the Mistake Bank source.');
    return {
      answerId: answer.id,
      attemptId: attempt.id,
      testId: test.id,
      testName: test.name,
      submittedAt: attempt.submitted_at,
      questionId: question.id,
      questionText: question.question_text,
      questionType: question.question_type,
      marks: question.marks,
      subject: ref(subjectById.get(question.subject_id)),
      topic: ref(topicById.get(question.topic_id)),
      options: question.question_type === 'NAT' ? [] : optionByQuestion.get(question.id) ?? [],
      outcome: resultOutcome,
      submittedAnswer: answer.submitted_answer,
      correctAnswer: question.correct_answer,
      marksAwarded: answer.marks_awarded!,
      explanation: question.explanation,
      timeSeconds: answer.time_seconds,
      markedForReview: answer.marked_for_review,
      mistakeType: answer.mistake_type as MistakeType | null,
      hasImage: Boolean(question.image_path),
      retryEligible: !question.archived
    };
  }).filter((item) =>
    (query.outcome === 'ALL' || item.outcome === query.outcome) &&
    (query.mistakeType === 'ALL' || (query.mistakeType === 'UNCLASSIFIED' ? item.mistakeType === null : item.mistakeType === query.mistakeType)) &&
    (!query.subjectId || item.subject.id === query.subjectId)
  ).sort((left, right) => right.submittedAt.localeCompare(left.submittedAt) || right.answerId.localeCompare(left.answerId));
  const from = (query.page - 1) * query.pageSize;
  return { items: mapped.slice(from, from + query.pageSize), page: query.page, pageSize: query.pageSize, total: mapped.length, totalPages: Math.ceil(mapped.length / query.pageSize) };
}
