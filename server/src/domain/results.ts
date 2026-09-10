export const mistakeTypes = [
  'CONCEPT_GAP',
  'FORMULA_FORGOTTEN',
  'CALCULATION',
  'MISREAD',
  'GUESS',
  'TIME_PRESSURE',
  'RECALL_FAILURE'
] as const;

export type MistakeType = typeof mistakeTypes[number];
export type ResultOutcome = 'CORRECT' | 'WRONG' | 'SKIPPED';

export type ResultAnswerState = {
  questionType: string;
  submittedAnswer: unknown;
  isCorrect: boolean | null;
  marksAwarded: number | null;
  mistakeType: string | null;
};

export type ResultCounts = {
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  attemptedCount: number;
  accuracy: number;
};

export class ResultIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResultIntegrityError';
  }
}

function invalid(message: string): never {
  throw new ResultIntegrityError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isCanonicalUnanswered(questionType: string, value: unknown): boolean {
  if (!isRecord(value)) invalid('Submitted answer must be an object.');
  const keys = Object.keys(value);
  if (questionType === 'NAT') {
    if (keys.length !== 1 || keys[0] !== 'value' || !('value' in value)) invalid('NAT submitted answer is malformed.');
    if (value.value !== null && (typeof value.value !== 'number' || !Number.isFinite(value.value))) invalid('NAT submitted answer is malformed.');
    return value.value === null;
  }
  if (questionType !== 'MCQ' && questionType !== 'MSQ') invalid('Question type is unsupported.');
  if (keys.length !== 1 || keys[0] !== 'optionKeys' || !Array.isArray(value.optionKeys) ||
      !value.optionKeys.every((key) => typeof key === 'string' && key.length > 0) ||
      new Set(value.optionKeys).size !== value.optionKeys.length) invalid('Option submitted answer is malformed.');
  return value.optionKeys.length === 0;
}

export function classifyResultAnswer(answer: ResultAnswerState): ResultOutcome {
  if (answer.marksAwarded === null || !Number.isFinite(answer.marksAwarded)) invalid('Answer has not been scored.');
  if (answer.mistakeType !== null && !mistakeTypes.includes(answer.mistakeType as MistakeType)) invalid('Answer has an invalid mistake classification.');
  const unanswered = isCanonicalUnanswered(answer.questionType, answer.submittedAnswer);
  if (answer.isCorrect === true) {
    if (unanswered || answer.marksAwarded <= 0 || answer.mistakeType !== null) invalid('Correct answer state is inconsistent.');
    return 'CORRECT';
  }
  if (answer.isCorrect === false) {
    if (unanswered || answer.marksAwarded > 0) invalid('Wrong answer state is inconsistent.');
    return 'WRONG';
  }
  if (!unanswered || answer.marksAwarded !== 0) invalid('Skipped answer state is inconsistent.');
  return 'SKIPPED';
}

export function summarizeOutcomes(outcomes: readonly ResultOutcome[]): ResultCounts {
  const correctCount = outcomes.filter((value) => value === 'CORRECT').length;
  const wrongCount = outcomes.filter((value) => value === 'WRONG').length;
  const skippedCount = outcomes.filter((value) => value === 'SKIPPED').length;
  const attemptedCount = correctCount + wrongCount;
  return {
    questionCount: outcomes.length,
    correctCount,
    wrongCount,
    skippedCount,
    attemptedCount,
    accuracy: attemptedCount === 0 ? 0 : Number(((correctCount / attemptedCount) * 100).toFixed(2))
  };
}
