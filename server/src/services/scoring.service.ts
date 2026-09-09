import { scoreAttempt, ScoringIntegrityError, type AttemptScore } from '../domain/scoring.js';
import { AppError } from '../errors/app-error.js';
import {
  findAnswerScoringState,
  findAttemptLinks,
  findAttemptRow,
  findAttemptTest,
  findScoringOptions,
  findScoringQuestions,
  updateAnswerScoring,
  updateAttemptScore,
  type AttemptRow
} from '../repositories/attempts.repository.js';

const scoringQueues = new Map<string, Promise<void>>();

function integrity(message: string): never {
  throw new AppError(409, 'SCORING_INTEGRITY_ERROR', message);
}

async function serialized<T>(key: string, work: () => Promise<T>): Promise<T> {
  const before = scoringQueues.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const queued = before.catch(() => undefined).then(() => gate);
  scoringQueues.set(key, queued);
  await before.catch(() => undefined);
  try {
    return await work();
  } finally {
    release();
    if (scoringQueues.get(key) === queued) scoringQueues.delete(key);
  }
}

type AnswerState = Awaited<ReturnType<typeof findAnswerScoringState>>[number];

type ScoringBundle = {
  attempt: AttemptRow;
  answerByQuestion: Map<string, AnswerState>;
  score: AttemptScore;
};

async function calculateSubmittedAttempt(attemptId: string): Promise<ScoringBundle> {
  const attempt = await findAttemptRow(attemptId);
  if (!attempt) throw new AppError(404, 'ATTEMPT_NOT_FOUND', 'Attempt was not found.');
  if (attempt.status !== 'SUBMITTED') throw new AppError(409, 'ATTEMPT_NOT_SUBMITTED', 'Only submitted attempts can be scored.');
  if (!await findAttemptTest(attempt.test_id)) integrity('The attempt test is missing.');

  const links = await findAttemptLinks(attempt.test_id);
  if (links.length === 0 || links.some((link, index) => link.position !== index + 1) ||
      new Set(links.map((link) => link.question_id)).size !== links.length) {
    integrity('The attempt test question order is invalid.');
  }

  const questionIds = links.map((link) => link.question_id);
  const [questions, options, answers] = await Promise.all([
    findScoringQuestions(questionIds),
    findScoringOptions(questionIds),
    findAnswerScoringState(attemptId)
  ]);
  if (questions.length !== questionIds.length || answers.length !== questionIds.length) {
    integrity('The attempt must have exactly one answer for every test question.');
  }

  const expected = new Set(questionIds);
  if (questions.some((question) => !expected.has(question.id)) ||
      answers.some((answer) => !expected.has(answer.question_id)) ||
      new Set(questions.map((question) => question.id)).size !== questions.length ||
      new Set(answers.map((answer) => answer.question_id)).size !== answers.length) {
    integrity('The attempt contains an off-test or duplicate question/answer.');
  }

  const questionById = new Map(questions.map((question) => [question.id, question]));
  const answerByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
  const optionKeysByQuestion = new Map<string, string[]>();
  for (const option of options) {
    if (!expected.has(option.question_id)) integrity('An option belongs to an off-test question.');
    const keys = optionKeysByQuestion.get(option.question_id) ?? [];
    keys.push(option.option_key);
    optionKeysByQuestion.set(option.question_id, keys);
  }

  try {
    const score = scoreAttempt(questionIds.map((questionId) => {
      const question = questionById.get(questionId);
      const answer = answerByQuestion.get(questionId);
      if (!question || !answer) integrity('The attempt scoring source is incomplete.');
      return {
        id: question.id,
        questionType: question.question_type,
        marks: question.marks,
        correctAnswer: question.correct_answer,
        optionKeys: optionKeysByQuestion.get(questionId) ?? [],
        submittedAnswer: answer.submitted_answer
      };
    }));
    return { attempt, answerByQuestion, score };
  } catch (error) {
    if (error instanceof ScoringIntegrityError) integrity(error.message);
    throw error;
  }
}

function scoringMatches(bundle: ScoringBundle, states: AnswerState[]): boolean {
  if (states.length !== bundle.score.answers.length) return false;
  const byQuestion = new Map(states.map((state) => [state.question_id, state]));
  return bundle.score.answers.every((expected) => {
    const actual = byQuestion.get(expected.questionId);
    return Boolean(actual) && actual!.is_correct === expected.isCorrect &&
      actual!.marks_awarded === expected.marksAwarded;
  });
}

function sourceFieldsMatch(before: Map<string, AnswerState>, after: AnswerState[]): boolean {
  return after.every((current) => {
    const original = before.get(current.question_id);
    return Boolean(original) && JSON.stringify(current.submitted_answer) === JSON.stringify(original!.submitted_answer) &&
      current.marked_for_review === original!.marked_for_review && current.time_seconds === original!.time_seconds &&
      current.created_at === original!.created_at && current.updated_at === original!.updated_at;
  });
}

async function ensureAttemptScoredCore(attemptId: string): Promise<AttemptRow> {
  const bundle = await calculateSubmittedAttempt(attemptId);
  const initialStates = [...bundle.answerByQuestion.values()];

  if (bundle.attempt.score !== null) {
    if (bundle.attempt.score !== bundle.score.score || !scoringMatches(bundle, initialStates)) {
      integrity('The persisted attempt score is inconsistent with its answers.');
    }
    return bundle.attempt;
  }

  for (const result of bundle.score.answers) {
    const answer = bundle.answerByQuestion.get(result.questionId);
    if (!answer || !await updateAnswerScoring(answer.id, result.isCorrect, result.marksAwarded)) {
      integrity('An answer disappeared while scoring.');
    }
  }

  const persistedAnswers = await findAnswerScoringState(attemptId);
  if (!sourceFieldsMatch(bundle.answerByQuestion, persistedAnswers) || !scoringMatches(bundle, persistedAnswers)) {
    integrity('Answer scoring persistence did not verify.');
  }

  const savedAttempt = await updateAttemptScore(attemptId, bundle.score.score);
  if (!savedAttempt || savedAttempt.score !== bundle.score.score) integrity('The final attempt score did not persist.');
  return savedAttempt;
}

export async function ensureAttemptScored(attemptId: string): Promise<AttemptRow> {
  return serialized(attemptId, () => ensureAttemptScoredCore(attemptId));
}
