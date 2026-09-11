import { aggregateMistakes, aggregateSubjects, aggregateSyllabus, analyticsBounds, analyticsTimezone, average, buildStudyTrend, roundMetric, scorePercent, testTypes, type AnalyticsTestType, type TestType } from '../domain/analytics.js';
import { classifyResultAnswer, ResultIntegrityError, summarizeOutcomes, type ResultOutcome } from '../domain/results.js';
import { AppError } from '../errors/app-error.js';
import { fetchAnalyticsAnswers, fetchAnalyticsAttempts, fetchAnalyticsLinks, fetchAnalyticsQuestions, fetchAnalyticsSettings, fetchAnalyticsSubjects, fetchAnalyticsTasks, fetchAnalyticsTests, fetchAnalyticsTopics, type AnalyticsAnswerRow, type AnalyticsAttemptRow, type AnalyticsQuestionRow, type AnalyticsTestRow } from '../repositories/analytics.repository.js';
import type { AnalyticsQuery } from '../validation/analytics.schemas.js';
import { actionableLeafRows } from '../domain/syllabus.js';

function integrity(message: string): never { throw new AppError(409, 'ANALYTICS_INTEGRITY_ERROR', message); }
const asTestType = (value: string): TestType => testTypes.includes(value as TestType) ? value as TestType : integrity('A test has an unsupported type.');
function outcome(question: AnalyticsQuestionRow, answer: AnalyticsAnswerRow): ResultOutcome {
  try { return classifyResultAnswer({ questionType: question.question_type, submittedAnswer: answer.submitted_answer, isCorrect: answer.is_correct, marksAwarded: answer.marks_awarded, mistakeType: answer.mistake_type }); }
  catch (error) { if (error instanceof ResultIntegrityError) integrity(error.message); throw error; }
}

type AttemptFacts = {
  attempt: AnalyticsAttemptRow; test: AnalyticsTestRow; testType: TestType; answers: Array<AnalyticsAnswerRow & { outcome: ResultOutcome; subjectId: string }>;
  counts: ReturnType<typeof summarizeOutcomes>; scorePercent: number;
};

function typeSummary(facts: AttemptFacts[]) {
  return testTypes.map((testType) => {
    const rows = facts.filter((fact) => fact.testType === testType); const outcomes = rows.flatMap((row) => row.answers.map((answer) => answer.outcome)); const counts = summarizeOutcomes(outcomes);
    return { testType, testsCompleted: rows.length, averageScorePercent: rows.length ? roundMetric(average(rows.map((row) => row.scorePercent))!) : null,
      accuracyPercent: rows.length ? counts.accuracy : null, correctCount: counts.correctCount, wrongCount: counts.wrongCount, skippedCount: counts.skippedCount, attemptedCount: counts.attemptedCount };
  });
}

function highlights(facts: AttemptFacts[], subjects: ReturnType<typeof aggregateSubjects>, mistakes: ReturnType<typeof aggregateMistakes>, actualStudyMinutes: number, adherence: number | null) {
  const items: Array<{ key: string; label: string; value: string; detail: string | null }> = [];
  if (facts.length) {
    const highest = [...facts].sort((a, b) => b.scorePercent - a.scorePercent || a.attempt.id.localeCompare(b.attempt.id))[0]!;
    items.push({ key: 'HIGHEST_TEST_SCORE', label: 'Highest test score', value: `${roundMetric(highest.scorePercent)}%`, detail: highest.test.name });
    items.push({ key: 'TESTS_COMPLETED', label: 'Tests completed', value: String(facts.length), detail: null });
  }
  const attempted = subjects.filter((subject) => subject.attemptedCount > 0).sort((a, b) => b.attemptedCount - a.attemptedCount || a.displayOrder - b.displayOrder)[0];
  if (attempted) items.push({ key: 'MOST_ATTEMPTED_SUBJECT', label: 'Most attempted subject', value: attempted.subjectName, detail: `${attempted.attemptedCount} attempted` });
  const frequent = mistakes.items.filter((item) => item.category !== 'UNCLASSIFIED' && item.count > 0).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))[0];
  if (frequent) items.push({ key: 'MOST_FREQUENT_MISTAKE', label: 'Most frequent recorded mistake', value: frequent.category, detail: `${frequent.count} entries` });
  if (actualStudyMinutes > 0) items.push({ key: 'ACTUAL_STUDY_TIME', label: 'Actual study time', value: `${actualStudyMinutes} min`, detail: null });
  if (adherence !== null) items.push({ key: 'STUDY_ADHERENCE', label: 'Study adherence', value: `${roundMetric(adherence)}%`, detail: null });
  return items;
}

export async function getAnalytics(query: AnalyticsQuery, now = new Date()) {
  const bounds = analyticsBounds(query.range, now);
  const [attemptRows, subjects, tasks, topics, settings] = await Promise.all([
    fetchAnalyticsAttempts(bounds.startInstant, bounds.endInstant), fetchAnalyticsSubjects(), fetchAnalyticsTasks(bounds.startDate, bounds.endDate), fetchAnalyticsTopics(), fetchAnalyticsSettings()
  ]);
  if (subjects.length !== 11 || topics.filter((topic) => topic.is_official).length !== 173) integrity('Official syllabus references are incomplete.');
  const sourceTestIds = [...new Set(attemptRows.map((row) => row.test_id))];
  const tests = await fetchAnalyticsTests(sourceTestIds); const testById = new Map(tests.map((row) => [row.id, row]));
  if (testById.size !== sourceTestIds.length || attemptRows.some((attempt) => !testById.has(attempt.test_id))) integrity('A submitted analytics test reference is missing.');
  tests.forEach((test) => asTestType(test.test_type));
  const filteredAttempts = attemptRows.filter((attempt) => query.testType === 'ALL' || testById.get(attempt.test_id)?.test_type === query.testType);
  const attemptIds = filteredAttempts.map((row) => row.id); const testIds = [...new Set(filteredAttempts.map((row) => row.test_id))];
  const [answers, links] = await Promise.all([fetchAnalyticsAnswers(attemptIds), fetchAnalyticsLinks(testIds)]);
  const questions = await fetchAnalyticsQuestions([...new Set(answers.map((row) => row.question_id))]); const questionById = new Map(questions.map((row) => [row.id, row]));
  const answersByAttempt = new Map<string, AnalyticsAnswerRow[]>(); for (const answer of answers) { const rows = answersByAttempt.get(answer.attempt_id) ?? []; rows.push(answer); answersByAttempt.set(answer.attempt_id, rows); }
  const linksByTest = new Map<string, string[]>(); for (const link of links) { const rows = linksByTest.get(link.test_id) ?? []; rows.push(link.question_id); linksByTest.set(link.test_id, rows); }
  const facts: AttemptFacts[] = filteredAttempts.map((attempt) => {
    const test = testById.get(attempt.test_id); if (!test || attempt.score === null || !attempt.submitted_at) integrity('Submitted analytics source is incomplete.');
    const attemptAnswers = answersByAttempt.get(attempt.id) ?? []; const expected = linksByTest.get(test.id) ?? [];
    if (!expected.length || attemptAnswers.length !== expected.length || new Set(expected).size !== expected.length || new Set(attemptAnswers.map((answer) => answer.question_id)).size !== attemptAnswers.length || attemptAnswers.some((answer) => !expected.includes(answer.question_id))) integrity('Submitted analytics answers do not match the saved test.');
    const mapped = attemptAnswers.map((answer) => { const question = questionById.get(answer.question_id); if (!question) integrity('An analytics question reference is missing.'); return { ...answer, outcome: outcome(question, answer), subjectId: question.subject_id }; });
    const totalMarks = test.total_marks ?? 0; const percent = scorePercent(attempt.score, totalMarks); const awarded = mapped.reduce((sum, answer) => sum + answer.marks_awarded!, 0);
    if (roundMetric(awarded) !== roundMetric(attempt.score)) integrity('A submitted score does not match persisted answer scoring.');
    return { attempt, test, testType: asTestType(test.test_type), answers: mapped, counts: summarizeOutcomes(mapped.map((answer) => answer.outcome)), scorePercent: percent };
  }).sort((a, b) => a.attempt.submitted_at!.localeCompare(b.attempt.submitted_at!) || a.attempt.id.localeCompare(b.attempt.id));
  const allOutcomes = facts.flatMap((fact) => fact.answers.map((answer) => answer.outcome)); const counts = summarizeOutcomes(allOutcomes);
  const plannedStudyMinutes = tasks.reduce((sum, task) => sum + task.planned_minutes, 0); const actualStudyMinutes = tasks.reduce((sum, task) => sum + (task.actual_minutes ?? 0), 0);
  if (tasks.some((task) => task.planned_minutes < 0 || (task.actual_minutes !== null && task.actual_minutes < 0))) integrity('Planner time contains an invalid value.');
  const adherence = plannedStudyMinutes === 0 ? null : (actualStudyMinutes / plannedStudyMinutes) * 100;
  const subjectPerformance = aggregateSubjects(subjects.map((row) => ({ id: row.id, code: row.code, name: row.name, displayOrder: row.display_order })), facts.flatMap((fact) => fact.answers.map((answer) => ({ subjectId: answer.subjectId, outcome: answer.outcome, timeSeconds: answer.time_seconds }))));
  const mistakeBreakdown = aggregateMistakes(facts.flatMap((fact) => fact.answers.map((answer) => ({ outcome: answer.outcome, mistakeType: answer.mistake_type }))));
  const syllabusProgress = aggregateSyllabus(actionableLeafRows(topics).map((topic) => topic.preparation_status));
  const studyAdherencePercent = adherence === null ? null : roundMetric(adherence);
  return {
    meta: { range: query.range, testType: query.testType as AnalyticsTestType, timezone: analyticsTimezone, startDate: bounds.startDate, endDate: bounds.endDate, examName: settings.exam_name, examDate: settings.exam_date },
    summary: { testsCompleted: facts.length, averageScorePercent: facts.length ? roundMetric(average(facts.map((fact) => fact.scorePercent))!) : null, accuracyPercent: counts.accuracy, actualStudyMinutes, plannedStudyMinutes, studyAdherencePercent, totalQuestions: counts.questionCount, questionsAttempted: counts.attemptedCount, correctCount: counts.correctCount, wrongCount: counts.wrongCount, skippedCount: counts.skippedCount },
    performanceTrend: facts.map((fact) => ({ attemptId: fact.attempt.id, testId: fact.test.id, testName: fact.test.name, testType: fact.testType, submittedAt: fact.attempt.submitted_at!, score: fact.attempt.score!, totalMarks: fact.test.total_marks!, scorePercent: roundMetric(fact.scorePercent), accuracyPercent: fact.counts.accuracy, correctCount: fact.counts.correctCount, wrongCount: fact.counts.wrongCount, skippedCount: fact.counts.skippedCount, totalTimeSeconds: fact.attempt.total_time_seconds ?? 0 })),
    outcomes: { ...counts, accuracyPercent: counts.accuracy }, subjectPerformance,
    studyTrend: buildStudyTrend(tasks.map((task) => ({ taskDate: task.task_date, plannedMinutes: task.planned_minutes, actualMinutes: task.actual_minutes })), query.range, bounds.today),
    mistakeBreakdown, syllabusProgress, testTypeSummary: typeSummary(facts),
    highlights: highlights(facts, subjectPerformance, mistakeBreakdown, actualStudyMinutes, adherence),
    fullMockTargetMarks: query.testType === 'FULL_MOCK' ? settings.target_marks : null
  };
}
