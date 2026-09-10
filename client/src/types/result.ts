import type { SubmittedAnswer } from './attempt';
import type { QuestionCorrectAnswer, QuestionOption, QuestionRef, QuestionType } from './question';
import type { TestType } from './test';

export const mistakeTypes = ['CONCEPT_GAP', 'FORMULA_FORGOTTEN', 'CALCULATION', 'MISREAD', 'GUESS', 'TIME_PRESSURE', 'RECALL_FAILURE'] as const;
export type MistakeType = typeof mistakeTypes[number];
export type ResultOutcome = 'CORRECT' | 'WRONG' | 'SKIPPED';

export const mistakeLabels: Record<MistakeType, string> = {
  CONCEPT_GAP: 'Concept gap',
  FORMULA_FORGOTTEN: 'Formula forgotten',
  CALCULATION: 'Calculation error',
  MISREAD: 'Misread question',
  GUESS: 'Guess',
  TIME_PRESSURE: 'Time pressure',
  RECALL_FAILURE: 'Recall failure'
};

export type ResultCounts = {
  questionCount: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  attemptedCount: number;
  accuracy: number;
};

export type ResultSummary = ResultCounts & {
  attemptId: string;
  testId: string;
  testName: string;
  testType: TestType;
  submittedAt: string;
  score: number;
  totalMarks: number;
  totalTimeSeconds: number;
};

export type ResultList = { items: ResultSummary[]; page: number; pageSize: number; total: number; totalPages: number };
export type ResultFilters = { page: number; pageSize: number; testType?: TestType; testId?: string };

export type SubjectResultBreakdown = ResultCounts & {
  subjectId: string;
  subjectName: string;
  timeSeconds: number;
};

export type ResultQuestion = {
  questionId: string;
  position: number;
  questionText: string;
  questionType: QuestionType;
  marks: 1 | 2;
  subject: QuestionRef;
  topic: QuestionRef;
  options: QuestionOption[];
  hasImage: boolean;
  submittedAnswer: SubmittedAnswer;
  correctAnswer: QuestionCorrectAnswer;
  outcome: ResultOutcome;
  isCorrect: boolean | null;
  marksAwarded: number;
  explanation: string | null;
  timeSeconds: number;
  markedForReview: boolean;
  mistakeType: MistakeType | null;
  retryEligible: boolean;
};

export type ResultDetail = ResultSummary & { subjectBreakdown: SubjectResultBreakdown[]; questions: ResultQuestion[] };

export type MistakeItem = Omit<ResultQuestion, 'position' | 'isCorrect'> & {
  answerId: string;
  attemptId: string;
  testId: string;
  testName: string;
  submittedAt: string;
};

export type MistakeList = { items: MistakeItem[]; page: number; pageSize: number; total: number; totalPages: number };
export type MistakeFilters = { page: number; pageSize: number; outcome?: 'ALL' | 'WRONG' | 'SKIPPED'; mistakeType?: 'ALL' | 'UNCLASSIFIED' | MistakeType; subjectId?: string };
export type MistakeUpdate = { attemptId: string; questionId: string; outcome: 'WRONG' | 'SKIPPED'; mistakeType: MistakeType | null };
