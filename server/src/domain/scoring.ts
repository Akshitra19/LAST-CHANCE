export type QuestionType = 'MCQ' | 'MSQ' | 'NAT';

export type ScoringQuestion = {
  id: string;
  questionType: string;
  marks: number;
  correctAnswer: unknown;
  optionKeys: string[];
  submittedAnswer: unknown;
};

export type ScoredAnswer = {
  questionId: string;
  isCorrect: boolean | null;
  marksAwarded: number;
  units: number;
};

export type AttemptScore = {
  answers: ScoredAnswer[];
  totalUnits: number;
  score: number;
};

export class ScoringIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScoringIntegrityError';
  }
}

function invalid(message: string): never {
  throw new ScoringIntegrityError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

function parseOptionAnswer(value: unknown, label: string): string[] {
  if (!isRecord(value) || !hasExactKeys(value, ['optionKeys']) || !Array.isArray(value.optionKeys)) {
    invalid(`${label} must contain only optionKeys.`);
  }
  const keys = value.optionKeys;
  if (!keys.every((key): key is string => typeof key === 'string' && key.length > 0)) {
    invalid(`${label} option keys must be non-empty strings.`);
  }
  if (new Set(keys).size !== keys.length) invalid(`${label} option keys must be unique.`);
  return keys;
}

function parseNatCorrectAnswer(value: unknown): { min: number; max: number } {
  if (!isRecord(value) || !hasExactKeys(value, ['min', 'max']) ||
      typeof value.min !== 'number' || !Number.isFinite(value.min) ||
      typeof value.max !== 'number' || !Number.isFinite(value.max) || value.min > value.max) {
    invalid('NAT correct answer must contain a finite inclusive min/max range.');
  }
  return { min: value.min, max: value.max };
}

function parseNatSubmission(value: unknown): number | null {
  if (!isRecord(value) || !hasExactKeys(value, ['value']) ||
      (value.value !== null && (typeof value.value !== 'number' || !Number.isFinite(value.value)))) {
    invalid('NAT submitted answer must contain one finite number or null.');
  }
  return value.value as number | null;
}

function assertQuestion(question: ScoringQuestion): asserts question is ScoringQuestion & { questionType: QuestionType; marks: 1 | 2 } {
  if (!question.id) invalid('Question id is required for scoring.');
  if (!['MCQ', 'MSQ', 'NAT'].includes(question.questionType)) invalid(`Question ${question.id} has an unsupported type.`);
  if (question.marks !== 1 && question.marks !== 2) invalid(`Question ${question.id} has invalid marks.`);
  if (question.questionType === 'NAT') {
    if (question.optionKeys.length !== 0) invalid(`NAT question ${question.id} cannot have options.`);
    return;
  }
  if (question.optionKeys.length < 2 || question.optionKeys.length > 6 ||
      question.optionKeys.some((key) => typeof key !== 'string' || key.length === 0) ||
      new Set(question.optionKeys).size !== question.optionKeys.length) {
    invalid(`Question ${question.id} has invalid options.`);
  }
}

export function unitsToAnswerMarks(units: number): number {
  return Number((units / 3).toFixed(6));
}

export function unitsToAttemptScore(units: number): number {
  return Number((units / 3).toFixed(2));
}

export function scoreQuestion(question: ScoringQuestion): ScoredAnswer {
  assertQuestion(question);
  const correctUnits = question.marks * 3;

  if (question.questionType === 'NAT') {
    const correct = parseNatCorrectAnswer(question.correctAnswer);
    const submitted = parseNatSubmission(question.submittedAnswer);
    if (submitted === null) return { questionId: question.id, isCorrect: null, marksAwarded: 0, units: 0 };
    const isCorrect = submitted >= correct.min && submitted <= correct.max;
    const units = isCorrect ? correctUnits : 0;
    return { questionId: question.id, isCorrect, marksAwarded: unitsToAnswerMarks(units), units };
  }

  const available = new Set(question.optionKeys);
  const correct = parseOptionAnswer(question.correctAnswer, `${question.questionType} correct answer`);
  const submitted = parseOptionAnswer(question.submittedAnswer, `${question.questionType} submitted answer`);
  if (correct.length === 0 || correct.some((key) => !available.has(key)) ||
      (question.questionType === 'MCQ' && correct.length !== 1)) {
    invalid(`Question ${question.id} has an invalid correct answer.`);
  }
  if (submitted.some((key) => !available.has(key)) || (question.questionType === 'MCQ' && submitted.length > 1)) {
    invalid(`Question ${question.id} has an invalid submitted answer.`);
  }
  if (submitted.length === 0) return { questionId: question.id, isCorrect: null, marksAwarded: 0, units: 0 };

  const correctSet = new Set(correct);
  const isCorrect = submitted.length === correct.length && submitted.every((key) => correctSet.has(key));
  const units = isCorrect ? correctUnits : question.questionType === 'MCQ' ? -question.marks : 0;
  return { questionId: question.id, isCorrect, marksAwarded: unitsToAnswerMarks(units), units };
}

export function scoreAttempt(questions: readonly ScoringQuestion[]): AttemptScore {
  if (questions.length === 0) invalid('A submitted attempt must contain at least one question.');
  if (new Set(questions.map((question) => question.id)).size !== questions.length) invalid('Attempt questions must be unique.');
  const answers = questions.map(scoreQuestion);
  const totalUnits = answers.reduce((sum, answer) => sum + answer.units, 0);
  return { answers, totalUnits, score: unitsToAttemptScore(totalUnits) };
}
