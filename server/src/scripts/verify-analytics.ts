import { app } from '../app.js';
import { addDays, adherencePercent, aggregateMistakes, aggregateSubjects, aggregateSyllabus, analyticsBounds, average, buildStudyTrend, istDateKey, scorePercent, syllabusStatuses } from '../domain/analytics.js';
import { classifyResultAnswer } from '../domain/results.js';
import { getSupabaseClient } from '../config/supabase.js';
import type { Json, TablesInsert } from '../types/database.types.js';

type ApiResult = { response: Response; body: unknown };
type Analytics = Awaited<ReturnType<typeof import('../services/analytics.service.js')['getAnalytics']>>;
type CreatedTest = { id: string; testType: string; totalMarks: number; questionCount: number };
const tableNames = ['app_settings', 'subjects', 'topics', 'daily_tasks', 'questions', 'question_options', 'tests', 'test_questions', 'attempts', 'answers'] as const;

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function near(actual: number | null, expected: number, message: string, tolerance = 0.02): void { assert(actual !== null && Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, received ${actual}`); }
function data<T>(result: ApiResult): T { return (result.body as { data: T }).data; }
const json = (body: unknown): RequestInit => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

function runPureVerification(): number {
  assert(scorePercent(8, 10) === 80 && scorePercent(32, 50) === 64, 'Per-test score normalization failed.');
  assert(average([scorePercent(8, 10), scorePercent(32, 50)]) === 72, 'Average test score used a weighted aggregate.');
  near(scorePercent(-1, 3), -33.333333, 'Negative score percentage failed', 0.0001);
  assert(adherencePercent(40, 50) === 80 && adherencePercent(60, 60) === 100 && adherencePercent(72, 60) === 120 && adherencePercent(0, 0) === null, 'Study adherence edge cases failed.');
  assert(classifyResultAnswer({ questionType: 'MSQ', submittedAnswer: { optionKeys: ['A'] }, isCorrect: false, marksAwarded: 0, mistakeType: null }) === 'WRONG', 'Zero-mark MSQ became Skipped.');
  assert(classifyResultAnswer({ questionType: 'NAT', submittedAnswer: { value: 3 }, isCorrect: false, marksAwarded: 0, mistakeType: null }) === 'WRONG', 'Zero-mark NAT became Skipped.');
  assert(classifyResultAnswer({ questionType: 'NAT', submittedAnswer: { value: null }, isCorrect: null, marksAwarded: 0, mistakeType: null }) === 'SKIPPED', 'Canonical skipped answer failed.');
  const subjects = aggregateSubjects([{ id: 'a', code: 'A', name: 'A', displayOrder: 1 }, { id: 'b', code: 'B', name: 'B', displayOrder: 2 }], [{ subjectId: 'a', outcome: 'CORRECT', timeSeconds: 10 }, { subjectId: 'a', outcome: 'WRONG', timeSeconds: 20 }, { subjectId: 'b', outcome: 'SKIPPED', timeSeconds: 12 }]);
  assert(subjects[0]?.attemptedCount === 2 && subjects[0].accuracyPercent === 50 && subjects[0].averageTimePerQuestionSeconds === 15 && subjects[1]?.attemptedCount === 0 && subjects[1].accuracyPercent === null && subjects[1].averageTimePerQuestionSeconds === 12, 'Subject aggregation failed.');
  const mistakeRows = [...['CONCEPT_GAP', 'FORMULA_FORGOTTEN', 'CALCULATION', 'MISREAD', 'GUESS', 'TIME_PRESSURE', 'RECALL_FAILURE'].map((mistakeType) => ({ outcome: 'WRONG' as const, mistakeType })), { outcome: 'SKIPPED' as const, mistakeType: null }, { outcome: 'CORRECT' as const, mistakeType: null }];
  const mistakes = aggregateMistakes(mistakeRows); assert(mistakes.total === 8 && mistakes.classified === 7 && mistakes.unclassified === 1 && mistakes.classificationRatePercent === 87.5, 'Mistake aggregation failed.');
  assert(aggregateMistakes([]).classificationRatePercent === 0, 'Empty mistake rate failed.');
  const syllabus = aggregateSyllabus(syllabusStatuses); assert(syllabus.totalTopics === 7 && syllabus.items.every((item) => item.count === 1), 'Syllabus aggregation failed.');
  assert(istDateKey('2026-09-09T18:29:59.999Z') === '2026-09-09' && istDateKey('2026-09-09T18:30:00.000Z') === '2026-09-10', 'Asia/Kolkata midnight boundary failed.');
  const bounds7 = analyticsBounds('7D', new Date('2026-09-10T06:30:00.000Z')); const bounds30 = analyticsBounds('30D', new Date('2026-09-10T06:30:00.000Z')); const bounds90 = analyticsBounds('90D', new Date('2026-09-10T06:30:00.000Z'));
  assert(bounds7.startDate === '2026-09-04' && bounds30.startDate === '2026-08-12' && bounds90.startDate === '2026-06-13', 'Bounded ranges are incorrect.');
  const daily = buildStudyTrend([{ taskDate: '2026-09-10', plannedMinutes: 60, actualMinutes: 72 }], '7D', '2026-09-10');
  assert(daily.length === 7 && daily[6]?.plannedMinutes === 60 && daily[6].actualMinutes === 72, 'Daily study buckets failed.');
  const weekly = buildStudyTrend([{ taskDate: '2026-09-07', plannedMinutes: 30, actualMinutes: 30 }, { taskDate: '2026-09-10', plannedMinutes: 20, actualMinutes: null }], '90D', '2026-09-10');
  assert(weekly.at(-1)?.startDate === '2026-09-07' && weekly.at(-1)?.plannedMinutes === 50 && weekly.at(-1)?.actualMinutes === 30, 'Monday-Sunday weekly buckets failed.');
  assert(buildStudyTrend([], 'ALL', '2026-09-10').length === 0, 'Empty all-history study trend failed.');
  return 31;
}

async function tableCounts(db: NonNullable<ReturnType<typeof getSupabaseClient>>) {
  const results = await Promise.all(tableNames.map((name) => db.from(name).select('*', { count: 'exact', head: true })));
  assert(results.every((result) => !result.error), 'Could not count application tables.');
  return Object.fromEntries(tableNames.map((name, index) => [name, results[index]!.count ?? 0]));
}

async function runIntegrationVerification(): Promise<void> {
  const db = getSupabaseClient(); assert(db, 'Real Supabase configuration is required for Analytics verification.');
  const baselineCounts = await tableCounts(db); const marker = `Temporary V1.11 analytics ${Date.now()}`;
  const questionIds: string[] = []; const testIds: string[] = []; const attemptIds: string[] = []; const taskIds: string[] = [];
  let topicSnapshots: Array<{ id: string; preparation_status: string; updated_at: string }> = [];
  let server: ReturnType<typeof app.listen> | null = null; let originalError: unknown = null;
  try {
    server = app.listen(0, '127.0.0.1'); await new Promise<void>((resolve) => server!.once('listening', resolve));
    const address = server.address(); assert(address && typeof address !== 'string', 'Analytics verifier server failed to bind.'); const base = `http://127.0.0.1:${address.port}`;
    const request = async (path: string, options: RequestInit = {}): Promise<ApiResult> => { const response = await fetch(base + path, options); const body = response.status === 204 ? null : await response.json(); return { response, body }; };
    const analytics = async (range: string, testType: string): Promise<Analytics> => { const result = await request(`/api/analytics?range=${range}&testType=${testType}`); assert(result.response.status === 200, `Analytics request failed: ${JSON.stringify(result.body)}`); return data<Analytics>(result); };
    for (const path of ['/api/analytics?range=BAD&testType=ALL', '/api/analytics?range=30D&testType=BAD', '/api/analytics?range=30D&testType=ALL&extra=1', '/api/analytics?range=7D&range=30D&testType=ALL']) assert((await request(path)).response.status === 400, `Strict analytics query validation failed for ${path}.`);
    const defaults = await request('/api/analytics'); assert(defaults.response.status === 200 && data<Analytics>(defaults).meta.range === '30D' && data<Analytics>(defaults).meta.testType === 'ALL', 'Analytics defaults failed.');
    const before30 = await analytics('30D', 'ALL'); const before7 = await analytics('7D', 'ALL'); const before90 = await analytics('90D', 'ALL'); const beforeAll = await analytics('ALL', 'ALL');

    const syllabus = await db.from('subjects').select('id,code,name,display_order').eq('syllabus_version', 'GATE_2027').order('display_order'); assert(!syllabus.error && syllabus.data.length === 11, 'Official analytics subjects are unavailable.');
    const topics = await db.from('topics').select('id,subject_id,preparation_status,updated_at').eq('syllabus_version', 'GATE_2027').order('id'); assert(!topics.error && topics.data.length === 173, 'Official analytics topics are unavailable.');
    const subjectByCode = new Map(syllabus.data.map((row) => [row.code, row])); const math = subjectByCode.get('CS-S1-ENGINEERING-MATHEMATICS'); const ga = subjectByCode.get('GA'); const core = syllabus.data.find((row) => row.code !== 'GA' && row.code !== 'CS-S1-ENGINEERING-MATHEMATICS'); assert(math && ga && core, 'Required Full Mock subjects are unavailable.');
    const topicFor = (subjectId: string) => topics.data.find((topic) => topic.subject_id === subjectId); const mathTopic = topicFor(math.id); const gaTopic = topicFor(ga.id); const coreTopic = topicFor(core.id); assert(mathTopic && gaTopic && coreTopic, 'Required analytics topics are unavailable.');
    topicSnapshots = topics.data.slice(0, 7).map((row) => ({ id: row.id, preparation_status: row.preparation_status, updated_at: row.updated_at }));
    for (let index = 0; index < topicSnapshots.length; index++) { const preparationStatus = syllabusStatuses[index]; assert(preparationStatus, 'Missing syllabus status fixture.'); const result = await db.from('topics').update({ preparation_status: preparationStatus, updated_at: new Date().toISOString() }).eq('id', topicSnapshots[index]!.id); assert(!result.error, 'Could not prepare syllabus analytics fixture.'); }

    type PlannedQuestion = TablesInsert<'questions'> & { question_text: string };
    const correct = (type: string): Json => type === 'NAT' ? { min: 1, max: 1 } : { optionKeys: ['A'] };
    const make = (label: string, subjectId: string, topicId: string, marks: 1 | 2, questionType: 'MCQ' | 'MSQ' | 'NAT'): PlannedQuestion => ({ subject_id: subjectId, topic_id: topicId, question_text: `${marker} ${label}`, question_type: questionType, marks, correct_answer: correct(questionType), source: marker, explanation: null, difficulty: 'MEDIUM', year: 2026, updated_at: new Date().toISOString() });
    const planned: PlannedQuestion[] = [make('math-1', math.id, mathTopic.id, 1, 'MCQ'), make('math-2', math.id, mathTopic.id, 1, 'MSQ')];
    for (let index = 0; index < 6; index++) planned.push(make(`math-extra-${index}`, math.id, mathTopic.id, index < 5 ? 2 : 1, 'MCQ'));
    planned.push(make('core-1', core.id, coreTopic.id, 1, 'NAT'));
    for (let index = 0; index < 46; index++) planned.push(make(`core-extra-${index}`, core.id, coreTopic.id, index < 25 ? 2 : 1, 'MCQ'));
    for (let index = 0; index < 10; index++) planned.push(make(`ga-${index}`, ga.id, gaTopic.id, index < 5 ? 2 : 1, 'MCQ'));
    assert(planned.length === 65 && sum(planned.map((row) => row.marks)) === 100, 'Full Mock analytics fixture composition is invalid.');
    const insertedQuestions = await db.from('questions').insert(planned).select('id,question_text,question_type,marks'); assert(!insertedQuestions.error && insertedQuestions.data.length === 65, 'Could not create analytics questions.'); questionIds.push(...insertedQuestions.data.map((row) => row.id));
    const questionByText = new Map(insertedQuestions.data.map((row) => [row.question_text, row])); const q1 = questionByText.get(`${marker} math-1`); const q2 = questionByText.get(`${marker} math-2`); const q3 = questionByText.get(`${marker} core-1`); assert(q1 && q2 && q3, 'Analytics question fixture IDs are missing.');
    const createTest = async (body: Record<string, unknown>): Promise<CreatedTest> => { const result = await request('/api/tests', { method: 'POST', ...json(body) }); assert(result.response.status === 201, `Could not create analytics test: ${JSON.stringify(result.body)}`); const test = data<CreatedTest>(result); testIds.push(test.id); return test; };
    const topicTest = await createTest({ name: `${marker} Topic`, testType: 'TOPIC', durationMinutes: 10, topicId: mathTopic.id, questionIds: [q1.id, q2.id] });
    const customTest = await createTest({ name: `${marker} Custom`, testType: 'CUSTOM', durationMinutes: 10, questionIds: [q1.id, q2.id, q3.id] });
    const fullTest = await createTest({ name: `${marker} Full Mock`, testType: 'FULL_MOCK', durationMinutes: 180, questionIds });
    assert(topicTest.totalMarks === 2 && customTest.totalMarks === 3 && fullTest.totalMarks === 100, 'Analytics test totals are incorrect.');

    const now = analyticsBounds('30D').today; const iso = (date: string, hour = 12) => new Date(`${date}T${String(hour).padStart(2, '0')}:00:00+05:30`).toISOString();
    const empty = (type: string): Json => type === 'NAT' ? { value: null } : { optionKeys: [] }; const answer = (questionId: string, submitted_answer: Json, is_correct: boolean | null, marks_awarded: number, mistake_type: string | null, time_seconds: number): TablesInsert<'answers'> => ({ question_id: questionId, attempt_id: '', submitted_answer, is_correct, marks_awarded, mistake_type, time_seconds, marked_for_review: false, updated_at: new Date().toISOString() });
    const createAttempt = async (testId: string, date: string, score: number, answers: TablesInsert<'answers'>[]) => { const submittedAt = iso(date); const created = await db.from('attempts').insert({ test_id: testId, status: 'SUBMITTED', started_at: new Date(new Date(submittedAt).valueOf() - 3_600_000).toISOString(), submitted_at: submittedAt, score, total_time_seconds: sum(answers.map((row) => row.time_seconds ?? 0)), updated_at: new Date().toISOString() }).select('id').single(); assert(!created.error && created.data, 'Could not create analytics attempt.'); attemptIds.push(created.data.id); const rows = answers.map((row) => ({ ...row, attempt_id: created.data.id })); const inserted = await db.from('answers').insert(rows); assert(!inserted.error, 'Could not create analytics answers.'); return created.data.id; };
    const topicAttempt = await createAttempt(topicTest.id, now, 1, [answer(q1.id, { optionKeys: ['A'] }, true, 1, null, 10), answer(q2.id, { optionKeys: ['B'] }, false, 0, 'CONCEPT_GAP', 20)]);
    const customNegative = await createAttempt(customTest.id, addDays(now, -8), -0.33, [answer(q1.id, { optionKeys: ['B'] }, false, -0.333333, 'CALCULATION', 5), answer(q2.id, { optionKeys: ['B'] }, false, 0, null, 7), answer(q3.id, { value: 99 }, false, 0, 'MISREAD', 8)]);
    const customPositive = await createAttempt(customTest.id, addDays(now, -2), 2, [answer(q1.id, { optionKeys: ['A'] }, true, 1, null, 4), answer(q2.id, { optionKeys: ['A'] }, true, 1, null, 6), answer(q3.id, { value: null }, null, 0, 'TIME_PRESSURE', 10)]);
    const fullAnswers = insertedQuestions.data.map((question) => answer(question.id, empty(question.question_type), null, 0, null, 1)); const fullAttempt = await createAttempt(fullTest.id, addDays(now, -40), 0, fullAnswers);
    const archived = await db.from('questions').update({ archived: true, archived_at: new Date().toISOString() }).eq('id', q3.id); assert(!archived.error, 'Could not archive historical analytics fixture question.');

    const taskRows: TablesInsert<'daily_tasks'>[] = [[now, 60, 90], [addDays(now, -2), 30, 30], [addDays(now, -10), 20, null], [addDays(now, -40), 40, 20]].map(([taskDate, planned, actual]) => ({ task_date: taskDate as string, task_type: 'THEORY', planned_minutes: planned as number, actual_minutes: actual as number | null, status: 'DONE', subject_id: math.id, topic_id: mathTopic.id, notes: marker, updated_at: new Date().toISOString() }));
    const insertedTasks = await db.from('daily_tasks').insert(taskRows).select('id'); assert(!insertedTasks.error && insertedTasks.data.length === 4, 'Could not create analytics study fixtures.'); taskIds.push(...insertedTasks.data.map((row) => row.id));

    const sourceSnapshot = async () => { const [attempts, answers, tasks, topicStates, settings] = await Promise.all([db.from('attempts').select('id,score,submitted_at,total_time_seconds').in('id', attemptIds).order('id'), db.from('answers').select('attempt_id,question_id,is_correct,marks_awarded,mistake_type,time_seconds').in('attempt_id', attemptIds).order('attempt_id').order('question_id'), db.from('daily_tasks').select('id,task_date,planned_minutes,actual_minutes,status').in('id', taskIds).order('id'), db.from('topics').select('id,preparation_status,updated_at').in('id', topicSnapshots.map((row) => row.id)).order('id'), db.from('app_settings').select('singleton_key,target_marks,exam_date,exam_name,updated_at').eq('singleton_key', 'default').single()]); assert(!attempts.error && !answers.error && !tasks.error && !topicStates.error && !settings.error, 'Could not snapshot analytics sources.'); return JSON.stringify({ attempts: attempts.data, answers: answers.data, tasks: tasks.data, topics: topicStates.data, settings: settings.data }); };
    const beforeReads = await sourceSnapshot(); const after30 = await analytics('30D', 'ALL'); const repeat30 = await analytics('30D', 'ALL'); assert(JSON.stringify(after30) === JSON.stringify(repeat30), 'Identical analytics reads are not idempotent.'); assert(beforeReads === await sourceSnapshot(), 'Analytics GET mutated source data.');

    assert(after30.meta.timezone === 'Asia/Kolkata' && after30.summary.testsCompleted - before30.summary.testsCompleted === 3, '30D test count or timezone failed.');
    assert(after30.summary.correctCount - before30.summary.correctCount === 3 && after30.summary.wrongCount - before30.summary.wrongCount === 4 && after30.summary.skippedCount - before30.summary.skippedCount === 1 && after30.summary.questionsAttempted - before30.summary.questionsAttempted === 7, 'Outcome summary math failed.');
    assert(after30.summary.plannedStudyMinutes - before30.summary.plannedStudyMinutes === 110 && after30.summary.actualStudyMinutes - before30.summary.actualStudyMinutes === 120, '30D Planner totals failed.');
    near(after30.summary.averageScorePercent, sum(after30.performanceTrend.map((point) => point.scorePercent)) / after30.performanceTrend.length, 'API average per-test score failed');
    const expectedAccuracy = after30.summary.questionsAttempted === 0 ? 0 : (after30.summary.correctCount / after30.summary.questionsAttempted) * 100;
    near(after30.summary.accuracyPercent, expectedAccuracy, 'API overall accuracy failed');
    assert(after30.outcomes.accuracyPercent === after30.summary.accuracyPercent && after30.outcomes.attemptedCount === after30.summary.questionsAttempted, 'Outcome and summary accuracy disagree.');
    const expectedAdherence = after30.summary.plannedStudyMinutes === 0 ? null : (after30.summary.actualStudyMinutes / after30.summary.plannedStudyMinutes) * 100;
    if (expectedAdherence === null) assert(after30.summary.studyAdherencePercent === null, 'Zero-plan API adherence is not null.'); else near(after30.summary.studyAdherencePercent, expectedAdherence, 'API study adherence failed');
    const fixturePoints = after30.performanceTrend.filter((point) => attemptIds.includes(point.attemptId)); assert(fixturePoints.map((point) => point.attemptId).join(',') === [customNegative, customPositive, topicAttempt].join(','), 'Performance points are missing or not chronological.');
    near(fixturePoints.find((point) => point.attemptId === topicAttempt)?.scorePercent ?? null, 50, 'Topic score percentage failed'); near(fixturePoints.find((point) => point.attemptId === customNegative)?.scorePercent ?? null, -11, 'Negative score percentage failed'); near(fixturePoints.find((point) => point.attemptId === customPositive)?.scorePercent ?? null, 66.67, 'Custom score percentage failed');
    const mathAfter = after30.subjectPerformance.find((item) => item.subjectId === math.id); const mathBefore = before30.subjectPerformance.find((item) => item.subjectId === math.id); assert(mathAfter && mathAfter.questionCount - (mathBefore?.questionCount ?? 0) === 6 && mathAfter.attemptedCount - (mathBefore?.attemptedCount ?? 0) === 6, 'Subject counts failed.');
    const fixtureMathTime = 52; assert(mathAfter.totalTimeSeconds - (mathBefore?.totalTimeSeconds ?? 0) === fixtureMathTime, 'Subject question time failed.');
    near(mathAfter.averageTimePerQuestionSeconds, mathAfter.totalTimeSeconds / mathAfter.questionCount, 'Subject average question time failed');
    near(mathAfter.accuracyPercent, (mathAfter.correctCount / mathAfter.attemptedCount) * 100, 'Subject accuracy failed');
    const mistakesBefore = new Map(before30.mistakeBreakdown.items.map((item) => [item.category, item.count])); const mistakesAfter = new Map(after30.mistakeBreakdown.items.map((item) => [item.category, item.count])); for (const [category, expected] of Object.entries({ CONCEPT_GAP: 1, CALCULATION: 1, MISREAD: 1, TIME_PRESSURE: 1, UNCLASSIFIED: 1 })) assert((mistakesAfter.get(category as never) ?? 0) - (mistakesBefore.get(category as never) ?? 0) === expected, `Mistake count failed for ${category}.`);
    assert(after30.mistakeBreakdown.total - before30.mistakeBreakdown.total === 5 && after30.mistakeBreakdown.classified - before30.mistakeBreakdown.classified === 4 && after30.mistakeBreakdown.unclassified - before30.mistakeBreakdown.unclassified === 1, 'Mistake classification totals failed.');
    near(after30.mistakeBreakdown.classificationRatePercent, (after30.mistakeBreakdown.classified / after30.mistakeBreakdown.total) * 100, 'API mistake classification rate failed');
    assert(after30.studyTrend.length === 30 && sum(after30.studyTrend.map((bucket) => bucket.plannedMinutes)) - sum(before30.studyTrend.map((bucket) => bucket.plannedMinutes)) === 110, 'Daily study buckets failed against the API.');
    const expectedStatuses = await db.from('topics').select('preparation_status').eq('syllabus_version', 'GATE_2027'); assert(!expectedStatuses.error, 'Could not calculate expected syllabus snapshot.'); const expectedProgress = aggregateSyllabus(expectedStatuses.data.map((row) => row.preparation_status)); assert(JSON.stringify(after30.syllabusProgress) === JSON.stringify(expectedProgress) && after30.syllabusProgress.totalTopics === 173, 'Syllabus progress is not the current exact snapshot.');
    near(sum(after30.syllabusProgress.items.map((item) => item.percentage)), 100, 'Syllabus percentages do not total 100', 0.1);
    assert(after30.highlights.every((item) => item.label && item.value && !/recommend|predict|should/i.test(`${item.label} ${item.value} ${item.detail ?? ''}`)), 'Highlights are not purely factual.');

    const after7 = await analytics('7D', 'ALL'); const after90 = await analytics('90D', 'ALL'); const afterAll = await analytics('ALL', 'ALL');
    assert(after7.performanceTrend.some((point) => point.attemptId === topicAttempt) && after7.performanceTrend.some((point) => point.attemptId === customPositive) && !after7.performanceTrend.some((point) => point.attemptId === customNegative), '7D range filter failed.');
    const allSkippedPoint = after90.performanceTrend.find((point) => point.attemptId === fullAttempt);
    assert(allSkippedPoint && allSkippedPoint.accuracyPercent === 0 && allSkippedPoint.correctCount === 0 && allSkippedPoint.wrongCount === 0 && allSkippedPoint.skippedCount === 65, 'All-skipped zero-attempt analytics failed.');
    assert(after90.summary.testsCompleted - before90.summary.testsCompleted === 4, '90D range filter failed.');
    assert(afterAll.summary.testsCompleted - beforeAll.summary.testsCompleted === 4 && afterAll.performanceTrend.some((point) => point.attemptId === fullAttempt), 'ALL range filter failed.');
    assert(after7.summary.plannedStudyMinutes - before7.summary.plannedStudyMinutes === 90 && after90.summary.plannedStudyMinutes - before90.summary.plannedStudyMinutes === 150, 'Study range filtering failed.');
    assert(after90.studyTrend.length > 0 && after90.studyTrend.every((bucket) => new Date(`${bucket.startDate}T00:00:00Z`).getUTCDay() === 1), 'Weekly bucket boundaries are not Monday-based.');
    const custom30 = await analytics('30D', 'CUSTOM'); const topic30 = await analytics('30D', 'TOPIC'); const full90 = await analytics('90D', 'FULL_MOCK');
    assert(custom30.performanceTrend.filter((point) => attemptIds.includes(point.attemptId)).length === 2 && topic30.performanceTrend.some((point) => point.attemptId === topicAttempt) && full90.performanceTrend.some((point) => point.attemptId === fullAttempt), 'Test-type filters failed.');
    assert(JSON.stringify(custom30.studyTrend) === JSON.stringify(after30.studyTrend) && JSON.stringify(custom30.syllabusProgress) === JSON.stringify(after30.syllabusProgress), 'Test type altered study or syllabus analytics.');
    assert(JSON.stringify(after7.syllabusProgress) === JSON.stringify(after30.syllabusProgress) && JSON.stringify(after90.syllabusProgress) === JSON.stringify(after30.syllabusProgress), 'Date range altered the current syllabus snapshot.');
    assert(full90.fullMockTargetMarks !== null && custom30.fullMockTargetMarks === null, 'Full Mock target visibility failed.');
    const fullType = full90.testTypeSummary.find((item) => item.testType === 'FULL_MOCK'); assert(fullType && fullType.testsCompleted >= 1 && fullType.averageScorePercent !== null && fullType.accuracyPercent !== null, 'Full Mock type summary failed.');
    for (const item of after30.testTypeSummary) { const points = after30.performanceTrend.filter((point) => point.testType === item.testType); assert(item.testsCompleted === points.length, `Test-type count failed for ${item.testType}.`); if (points.length) near(item.averageScorePercent, sum(points.map((point) => point.scorePercent)) / points.length, `Test-type score failed for ${item.testType}`); else assert(item.averageScorePercent === null && item.accuracyPercent === null, `Empty test-type metrics failed for ${item.testType}.`); }

    const serialized = JSON.stringify(after30); assert(!/correctAnswer|correct_answer|submittedAnswer|submitted_answer|explanation|questionText|question_text|optionText|option_text|sb_secret_|service_role/i.test(serialized), 'Analytics response leaked answer or privileged data.');
    assert(!serialized.includes(marker + ' math-1') && !serialized.includes(marker + ' core-1'), 'Analytics response leaked question text.');
  } catch (error) { originalError = error; }
  finally {
    let cleanupError: unknown = null;
    try {
      if (attemptIds.length) { const result = await db.from('attempts').delete().in('id', attemptIds); if (result.error) throw result.error; }
      if (testIds.length) { const result = await db.from('tests').delete().in('id', testIds); if (result.error) throw result.error; }
      if (questionIds.length) { const result = await db.from('questions').delete().in('id', questionIds); if (result.error) throw result.error; }
      if (taskIds.length) { const result = await db.from('daily_tasks').delete().in('id', taskIds); if (result.error) throw result.error; }
      for (const topic of topicSnapshots) { const result = await db.from('topics').update({ preparation_status: topic.preparation_status, updated_at: topic.updated_at }).eq('id', topic.id); if (result.error) throw result.error; }
      const remaining = await Promise.all([attemptIds.length ? db.from('attempts').select('id', { count: 'exact', head: true }).in('id', attemptIds) : Promise.resolve({ count: 0, error: null }), testIds.length ? db.from('tests').select('id', { count: 'exact', head: true }).in('id', testIds) : Promise.resolve({ count: 0, error: null }), questionIds.length ? db.from('questions').select('id', { count: 'exact', head: true }).in('id', questionIds) : Promise.resolve({ count: 0, error: null }), taskIds.length ? db.from('daily_tasks').select('id', { count: 'exact', head: true }).in('id', taskIds) : Promise.resolve({ count: 0, error: null })]);
      assert(remaining.every((result) => !result.error && (result.count ?? 0) === 0), 'TEMP_ANALYTICS_ROWS_REMAINING is not zero.');
      assert(JSON.stringify(await tableCounts(db)) === JSON.stringify(baselineCounts), 'PERMANENT_MUTATIONS is not zero.');
    } catch (error) { cleanupError = error; }
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    if (cleanupError) throw cleanupError; if (originalError) throw originalError;
  }
}

async function main() {
  const pureCases = runPureVerification(); await runIntegrationVerification();
  console.log(JSON.stringify({ status: 'PASS', pureCases, realDatabase: true, ranges: ['7D', '30D', '90D', 'ALL'], testTypes: ['ALL', 'TOPIC', 'CUSTOM', 'FULL_MOCK'], timezone: 'Asia/Kolkata', graphs: 6, leakage: 0, readOnly: true, TEMP_ANALYTICS_ROWS_REMAINING: 0, PERMANENT_MUTATIONS: 0, PERMANENT_STORAGE_MUTATIONS: 0 }, null, 2));
}

main().catch((error) => { console.error(`Analytics verification failed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });
