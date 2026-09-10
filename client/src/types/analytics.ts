import type { MistakeType, ResultOutcome } from './result';
import type { TestType } from './test';

export const analyticsRanges = ['7D', '30D', '90D', 'ALL'] as const;
export const analyticsTestTypes = ['ALL', 'TOPIC', 'CUSTOM', 'FULL_MOCK'] as const;
export const syllabusStatuses = ['NOT_STARTED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'MASTERED', 'WEAK'] as const;
export type AnalyticsRange = typeof analyticsRanges[number];
export type AnalyticsTestType = typeof analyticsTestTypes[number];
export type MistakeCategory = MistakeType | 'UNCLASSIFIED';

export type AnalyticsResponse = {
  meta: { range: AnalyticsRange; testType: AnalyticsTestType; timezone: 'Asia/Kolkata'; startDate: string | null; endDate: string; examName: string; examDate: string | null };
  summary: { testsCompleted: number; averageScorePercent: number | null; accuracyPercent: number; actualStudyMinutes: number; plannedStudyMinutes: number; studyAdherencePercent: number | null; totalQuestions: number; questionsAttempted: number; correctCount: number; wrongCount: number; skippedCount: number };
  performanceTrend: Array<{ attemptId: string; testId: string; testName: string; testType: TestType; submittedAt: string; score: number; totalMarks: number; scorePercent: number; accuracyPercent: number; correctCount: number; wrongCount: number; skippedCount: number; totalTimeSeconds: number }>;
  outcomes: { questionCount: number; correctCount: number; wrongCount: number; skippedCount: number; attemptedCount: number; accuracy: number; accuracyPercent: number };
  subjectPerformance: Array<{ subjectId: string; subjectCode: string; subjectName: string; displayOrder: number; questionCount: number; correctCount: number; wrongCount: number; skippedCount: number; attemptedCount: number; accuracy: number; accuracyPercent: number | null; totalTimeSeconds: number; averageTimePerQuestionSeconds: number }>;
  studyTrend: Array<{ startDate: string; endDate: string; label: string; plannedMinutes: number; actualMinutes: number }>;
  mistakeBreakdown: { items: Array<{ category: MistakeCategory; count: number }>; total: number; classified: number; unclassified: number; classificationRatePercent: number };
  syllabusProgress: { totalTopics: number; items: Array<{ status: typeof syllabusStatuses[number]; count: number; percentage: number }> };
  testTypeSummary: Array<{ testType: TestType; testsCompleted: number; averageScorePercent: number | null; accuracyPercent: number | null; correctCount: number; wrongCount: number; skippedCount: number; attemptedCount: number }>;
  highlights: Array<{ key: string; label: string; value: string; detail: string | null }>;
  fullMockTargetMarks: number | null;
};

export const outcomeColors: Record<ResultOutcome, string> = { CORRECT: '#2f855a', WRONG: '#b42318', SKIPPED: '#7b8794' };
