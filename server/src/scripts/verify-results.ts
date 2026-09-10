import { app } from '../app.js';
import { classifyResultAnswer, mistakeTypes, ResultIntegrityError, summarizeOutcomes } from '../domain/results.js';
import { getSupabaseClient } from '../config/supabase.js';
import { backdateAttemptForVerification, deleteAttemptRow, findAnswerScoringState, findAttemptRow } from '../repositories/attempts.repository.js';
import { deleteQuestionRowForCleanup, findQuestionRow } from '../repositories/questions.repository.js';
import { deleteTestRow, findTestQuestions, findTestRow } from '../repositories/tests.repository.js';
import { listQuestionImageObjects, removeQuestionImage, removeQuestionImageObject } from '../services/question-storage.js';

type ApiResult = { response: Response; body: unknown };
type Attempt = { id: string; status: string; submittedAt: string | null };
type ResultItem = { attemptId: string; testId: string; score: number; totalMarks: number; questionCount: number; correctCount: number; wrongCount: number; skippedCount: number; attemptedCount: number; accuracy: number; totalTimeSeconds: number; submittedAt: string };
type Review = { questionId: string; position: number; questionText: string; questionType: string; outcome: string; isCorrect: boolean | null; marksAwarded: number; explanation: string | null; timeSeconds: number; markedForReview: boolean; mistakeType: string | null; hasImage: boolean; retryEligible: boolean; submittedAnswer: unknown; correctAnswer: unknown };
type ResultDetail = ResultItem & { subjectBreakdown: Array<{ questionCount: number; correctCount: number; wrongCount: number; skippedCount: number; attemptedCount: number; accuracy: number; timeSeconds: number }>; questions: Review[] };
type MistakeItem = { answerId: string; attemptId: string; submittedAt: string; questionId: string; outcome: string; mistakeType: string | null; marksAwarded: number; retryEligible: boolean; submittedAnswer: unknown; correctAnswer: unknown };
type Page<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function data<T>(result: ApiResult): T { return (result.body as { data: T }).data; }
const json = (body: unknown): RequestInit => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

function runPureVerification(): void {
  const correct = classifyResultAnswer({ questionType: 'MCQ', submittedAnswer: { optionKeys: ['A'] }, isCorrect: true, marksAwarded: 1, mistakeType: null });
  const wrongZero = classifyResultAnswer({ questionType: 'MSQ', submittedAnswer: { optionKeys: ['A'] }, isCorrect: false, marksAwarded: 0, mistakeType: 'CONCEPT_GAP' });
  const skipped = classifyResultAnswer({ questionType: 'NAT', submittedAnswer: { value: null }, isCorrect: null, marksAwarded: 0, mistakeType: 'TIME_PRESSURE' });
  assert(correct === 'CORRECT' && wrongZero === 'WRONG' && skipped === 'SKIPPED', 'Canonical outcome classification failed.');
  const summary = summarizeOutcomes([correct, wrongZero, skipped]);
  assert(summary.correctCount === 1 && summary.wrongCount === 1 && summary.skippedCount === 1 && summary.attemptedCount === 2 && summary.accuracy === 50, 'Result counts failed.');
  assert(summarizeOutcomes(['SKIPPED']).accuracy === 0, 'Zero-attempt accuracy must be zero.');
  let malformedRejected = false;
  try { classifyResultAnswer({ questionType: 'MSQ', submittedAnswer: { optionKeys: [] }, isCorrect: false, marksAwarded: 0, mistakeType: null }); }
  catch (error) { malformedRejected = error instanceof ResultIntegrityError; }
  assert(malformedRejected && mistakeTypes.length === 7, 'Result integrity or mistake categories failed.');
}

async function runIntegrationVerification(): Promise<void> {
  const db = getSupabaseClient();
  assert(db, 'Real Supabase configuration is required for Results verification.');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string', 'Verifier server failed to bind.');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (path: string, options: RequestInit = {}): Promise<ApiResult> => {
    const response = await fetch(base + path, options);
    const contentType = response.headers.get('content-type') ?? '';
    const body: unknown = response.status === 204 ? null : contentType.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer());
    return { response, body };
  };
  const resultMutationState = async (attemptId: string): Promise<string> => {
    const answers = await db.from('answers')
      .select('id,question_id,submitted_answer,is_correct,marks_awarded,time_seconds,marked_for_review,mistake_type')
      .eq('attempt_id', attemptId);
    assert(!answers.error, 'Could not inspect result read-mutation state.');
    return JSON.stringify({
      attempt: await findAttemptRow(attemptId),
      answers: answers.data.sort((left, right) => left.question_id.localeCompare(right.question_id))
    });
  };
  const questions: string[] = [], tests: string[] = [], attempts: string[] = [];
  let baselineTests: string[] = [];
  try {
    baselineTests = data<Page<{ id: string }>>(await request('/api/tests?page=1&pageSize=100')).items.map((item) => item.id).sort();
    const syllabus = data<{ subjects: Array<{ id: string; topics: Array<{ id: string }> }> }>(await request('/api/syllabus'));
    const scope = syllabus.subjects[0];
    assert(scope?.topics[0], 'A seeded subject/topic is required.');
    const common = { subjectId: scope.id, topicId: scope.topics[0].id, difficulty: 'MEDIUM', year: 2026, source: 'Temporary V1.10 verifier' };
    const makeQuestion = async (name: string, body: Record<string, unknown>): Promise<string> => {
      const created = await request('/api/questions', { method: 'POST', ...json({ ...common, questionText: `Temporary V1.10 ${name}`, explanation: name === 'NAT skipped' ? null : `Explanation for ${name}`, ...body }) });
      assert(created.response.status === 201, `Could not create ${name}.`);
      const id = data<{ id: string }>(created).id; questions.push(id); return id;
    };
    const mcq = { questionType: 'MCQ', marks: 1, options: [{ key: 'A', text: 'Correct' }, { key: 'B', text: 'Wrong' }], correctAnswer: { optionKeys: ['A'] } };
    const ids = {
      correct: await makeQuestion('MCQ correct', mcq),
      wrongMsq: await makeQuestion('MSQ wrong zero', { questionType: 'MSQ', marks: 1, options: [{ key: 'A', text: 'Correct A' }, { key: 'B', text: 'Wrong' }, { key: 'C', text: 'Correct C' }], correctAnswer: { optionKeys: ['A', 'C'] } }),
      skippedNat: await makeQuestion('NAT skipped', { questionType: 'NAT', marks: 1, options: [], correctAnswer: { min: -2.5, max: 1.25 } }),
      wrongOne: await makeQuestion('MCQ wrong one', mcq),
      wrongTwo: await makeQuestion('MCQ wrong two', mcq),
      wrongThree: await makeQuestion('MCQ wrong three', mcq),
      outsider: await makeQuestion('outside test', mcq)
    };
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Z9sAAAAASUVORK5CYII=', 'base64');
    const uploaded = await request(`/api/questions/${ids.correct}/image`, { method: 'PUT', headers: { 'content-type': 'image/png' }, body: png });
    assert(uploaded.response.status === 200, 'Result fixture image upload failed.');
    const createTest = async (name: string, questionIds: string[]): Promise<string> => {
      const created = await request('/api/tests', { method: 'POST', ...json({ name, testType: 'CUSTOM', durationMinutes: 10, questionIds }) });
      assert(created.response.status === 201, `Could not create ${name}.`);
      const id = data<{ id: string }>(created).id; tests.push(id); return id;
    };
    const mainTest = await createTest('Temporary V1.10 result test', [ids.correct, ids.wrongMsq, ids.skippedNat, ids.wrongOne]);
    const negativeTest = await createTest('Temporary V1.10 negative result', [ids.wrongOne, ids.wrongTwo, ids.wrongThree]);
    const start = async (testId: string): Promise<Attempt> => {
      const created = await request(`/api/tests/${testId}/attempts`, { method: 'POST' });
      assert(created.response.status === 201, 'Attempt creation failed.');
      const attempt = data<Attempt>(created); attempts.push(attempt.id);
      await backdateAttemptForVerification(attempt.id, new Date(Date.now() - 120_000).toISOString());
      return attempt;
    };
    const save = async (attemptId: string, questionId: string, submittedAnswer: unknown, markedForReview = false, timeSeconds = 0) => {
      const saved = await request(`/api/attempts/${attemptId}/answers/${questionId}`, { method: 'PUT', ...json({ submittedAnswer, markedForReview, timeSeconds }) });
      assert(saved.response.status === 200, 'Answer save failed.');
    };
    const submit = async (attemptId: string) => {
      const submitted = await request(`/api/attempts/${attemptId}/submit`, { method: 'POST' });
      assert(submitted.response.status === 200, 'Attempt submit/scoring failed.');
      return submitted;
    };

    const active = await start(mainTest);
    const activeResult = await request(`/api/results/${active.id}`);
    assert(activeResult.response.status === 409 && (activeResult.body as { error: { code: string } }).error.code === 'RESULT_NOT_READY', 'Active result access was not rejected.');
    assert(!/correctAnswer|correct_answer|explanation|isCorrect|marksAwarded/.test(JSON.stringify(activeResult.body)), 'Active result error leaked answer data.');
    const activeMistake = await request(`/api/results/${active.id}/questions/${ids.correct}/mistake`, { method: 'PATCH', ...json({ mistakeType: 'CONCEPT_GAP' }) });
    assert(activeMistake.response.status === 409 && !/correctAnswer|correct_answer|explanation|isCorrect|marksAwarded/.test(JSON.stringify(activeMistake.body)), 'Active mistake update was not safely rejected.');
    await save(active.id, ids.correct, { optionKeys: ['A'] }, false, 10);
    await save(active.id, ids.wrongMsq, { optionKeys: ['A'] }, true, 20);
    await save(active.id, ids.wrongOne, { optionKeys: ['B'] }, false, 30);
    await submit(active.id);
    const safeAttempt = await request(`/api/attempts/${active.id}`);
    assert(!/correctAnswer|correct_answer|explanation|isCorrect|marksAwarded/.test(JSON.stringify(safeAttempt.body)), 'Attempt API leaked post-submit result data.');

    const resultReadBefore = await resultMutationState(active.id);
    const list = await request(`/api/results?testId=${mainTest}&page=1&pageSize=20`);
    assert(list.response.status === 200, `Result history failed with HTTP ${list.response.status}: ${JSON.stringify(list.body)}`);
    assert(!/correctAnswer|explanation|submittedAnswer|isCorrect|marksAwarded|"options"/.test(JSON.stringify(list.body)), 'Result history leaked question data.');
    const summary = data<Page<ResultItem>>(list).items.find((item) => item.attemptId === active.id);
    assert(summary && summary.score === 0.67 && summary.totalMarks === 4 && summary.questionCount === 4 && summary.correctCount === 1 && summary.wrongCount === 2 && summary.skippedCount === 1 && summary.attemptedCount === 3 && summary.accuracy === 33.33, 'Result history summary is incorrect.');
    const detailResult = await request(`/api/results/${active.id}`);
    assert(detailResult.response.status === 200, 'Result detail failed.');
    const detail = data<ResultDetail>(detailResult);
    assert(detail.questions.map((item) => item.questionId).join(',') === [ids.correct, ids.wrongMsq, ids.skippedNat, ids.wrongOne].join(','), 'Result question order changed.');
    assert(detail.questions[0]?.hasImage && detail.questions[0]?.explanation === 'Explanation for MCQ correct' && detail.questions[1]?.outcome === 'WRONG' && detail.questions[1]?.marksAwarded === 0 && detail.questions[2]?.outcome === 'SKIPPED' && detail.questions[2]?.isCorrect === null && detail.questions[2]?.explanation === null, 'Result question review is incorrect.');
    assert(detail.subjectBreakdown.length === 1 && detail.subjectBreakdown[0]?.questionCount === 4 && detail.subjectBreakdown[0]?.correctCount === 1 && detail.subjectBreakdown[0]?.wrongCount === 2 && detail.subjectBreakdown[0]?.skippedCount === 1 && detail.subjectBreakdown[0]?.timeSeconds === 60, 'Subject breakdown is incorrect.');
    const image = await request(`/api/questions/${ids.correct}/image`);
    assert(image.response.status === 200 && image.response.headers.get('content-type')?.startsWith('image/png'), 'Private result image could not be retrieved.');
    assert(resultReadBefore === await resultMutationState(active.id), 'Reading an already-scored result changed persisted result state.');

    const scoringBefore = JSON.stringify({ attempt: await findAttemptRow(active.id), answers: (await findAnswerScoringState(active.id)).sort((a, b) => a.question_id.localeCompare(b.question_id)) });
    const patch = async (questionId: string, mistakeType: string | null, body: Record<string, unknown> = { mistakeType }) => request(`/api/results/${active.id}/questions/${questionId}/mistake`, { method: 'PATCH', ...json(body) });
    assert((await patch(ids.wrongMsq, 'CONCEPT_GAP')).response.status === 200, 'Wrong classification did not save.');
    assert((await patch(ids.wrongMsq, 'CALCULATION')).response.status === 200, 'Wrong classification did not update.');
    assert((await patch(ids.wrongMsq, null)).response.status === 200, 'Wrong classification did not clear.');
    assert((await patch(ids.skippedNat, 'TIME_PRESSURE')).response.status === 200, 'Skipped classification did not save.');
    const persisted = await db.from('answers').select('question_id,mistake_type').eq('attempt_id', active.id);
    assert(!persisted.error && persisted.data.find((row) => row.question_id === ids.skippedNat)?.mistake_type === 'TIME_PRESSURE' && persisted.data.find((row) => row.question_id === ids.wrongMsq)?.mistake_type === null, 'Mistake classification did not persist.');
    const scoringAfter = JSON.stringify({ attempt: await findAttemptRow(active.id), answers: (await findAnswerScoringState(active.id)).sort((a, b) => a.question_id.localeCompare(b.question_id)) });
    assert(scoringBefore === scoringAfter, 'Mistake editing changed scoring or answer source fields.');
    assert((await patch(ids.correct, 'CONCEPT_GAP')).response.status === 409, 'Correct answer accepted a mistake classification.');
    assert((await patch(ids.wrongMsq, 'UNKNOWN')).response.status === 400, 'Unknown mistake category was accepted.');
    assert((await patch(ids.wrongMsq, 'CONCEPT_GAP', { mistakeType: 'CONCEPT_GAP', extra: true })).response.status === 400, 'Unknown mistake body field was accepted.');
    assert((await patch(ids.outsider, 'CONCEPT_GAP')).response.status === 404, 'Off-test question accepted a classification.');
    assert((await request(`/api/results/${active.id}/questions/00000000-0000-4000-8000-000000000001/mistake`, { method: 'PATCH', ...json({ mistakeType: 'CONCEPT_GAP' }) })).response.status === 404, 'Missing result question did not return 404.');
    assert((await request('/api/results/00000000-0000-4000-8000-000000000001/questions/00000000-0000-4000-8000-000000000002/mistake', { method: 'PATCH', ...json({ mistakeType: 'CONCEPT_GAP' }) })).response.status === 404, 'Missing result did not return 404.');
    const repeat = await start(mainTest);
    await save(repeat.id, ids.wrongMsq, { optionKeys: ['B'] });
    await save(repeat.id, ids.wrongOne, { optionKeys: ['B'] });
    await submit(repeat.id);
    const zero = await start(mainTest); await submit(zero.id);
    const zeroDetail = data<ResultDetail>(await request(`/api/results/${zero.id}`));
    assert(zeroDetail.attemptedCount === 0 && zeroDetail.accuracy === 0 && zeroDetail.skippedCount === 4, 'Zero-attempt result semantics failed.');

    const legacy = await start(mainTest);
    await save(legacy.id, ids.correct, { optionKeys: ['A'] }, true, 7);
    const legacyBeforeAnswers = await findAnswerScoringState(legacy.id);
    const submittedAt = new Date().toISOString();
    const direct = await db.from('attempts').update({ status: 'SUBMITTED', submitted_at: submittedAt, total_time_seconds: 7, score: null }).eq('id', legacy.id).eq('status', 'IN_PROGRESS');
    assert(!direct.error, 'Legacy result fixture could not be submitted.');
    const recovered = await request(`/api/results/${legacy.id}`);
    const recoveredAttempt = await findAttemptRow(legacy.id);
    assert(recovered.response.status === 200 && recoveredAttempt?.score === 1 &&
      recoveredAttempt.submitted_at !== null && new Date(recoveredAttempt.submitted_at).getTime() === new Date(submittedAt).getTime(),
    'Legacy null-score result did not recover.');
    const submittedAnswersByQuestion = (rows: Awaited<ReturnType<typeof findAnswerScoringState>>) => rows
      .map((row) => ({ questionId: row.question_id, submittedAnswer: row.submitted_answer }))
      .sort((left, right) => left.questionId.localeCompare(right.questionId));
    assert(JSON.stringify(submittedAnswersByQuestion(await findAnswerScoringState(legacy.id))) ===
      JSON.stringify(submittedAnswersByQuestion(legacyBeforeAnswers)), 'Legacy recovery changed submitted answers.');

    const negative = await start(negativeTest);
    for (const id of [ids.wrongOne, ids.wrongTwo, ids.wrongThree]) await save(negative.id, id, { optionKeys: ['B'] });
    await submit(negative.id);
    const negativeHistory = data<Page<ResultItem>>(await request(`/api/results?testId=${negativeTest}&page=1&pageSize=20`));
    const negativeDetail = data<ResultDetail>(await request(`/api/results/${negative.id}`));
    assert(negativeHistory.items[0]?.score === -1 && negativeDetail.score === -1, 'Negative result score was clamped or lost.');

    assert((await request(`/api/questions/${ids.wrongMsq}`, { method: 'PATCH', ...json({ archived: true }) })).response.status === 200, 'Historical question could not be archived.');
    const archivedDetail = data<ResultDetail>(await request(`/api/results/${active.id}`)).questions.find((item) => item.questionId === ids.wrongMsq);
    assert(archivedDetail?.retryEligible === false && archivedDetail.correctAnswer, 'Archived historical result is not reviewable or was marked retry eligible.');
    const mistakesAll = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=100&outcome=ALL&mistakeType=ALL'));
    assert(mistakesAll.items.every((item) => Number.isFinite(item.marksAwarded)), 'Mistake Bank omitted scored marks required by the review UI.');
    assert(mistakesAll.items.some((item) => item.questionId === ids.wrongMsq && item.retryEligible === false), 'Mistake Bank lost archived historical rows or marked them retry eligible.');
    assert(mistakesAll.items.some((item) => item.questionId === ids.skippedNat && item.outcome === 'SKIPPED'), 'Mistake Bank omitted a scored skipped answer.');
    assert(!mistakesAll.items.some((item) => item.attemptId === active.id && item.questionId === ids.correct), 'Mistake Bank included a correct answer.');
    assert(mistakesAll.items.filter((item) => item.questionId === ids.wrongOne).length >= 2, 'Repeated question history was collapsed.');
    const wrongOnly = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=100&outcome=WRONG&mistakeType=ALL'));
    const skippedOnly = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=100&outcome=SKIPPED&mistakeType=ALL'));
    const unclassified = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=100&outcome=ALL&mistakeType=UNCLASSIFIED'));
    const category = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=100&outcome=ALL&mistakeType=TIME_PRESSURE'));
    const subject = data<Page<MistakeItem>>(await request(`/api/mistakes?page=1&pageSize=100&outcome=ALL&mistakeType=ALL&subjectId=${scope.id}`));
    assert(wrongOnly.items.every((item) => item.outcome === 'WRONG') && skippedOnly.items.every((item) => item.outcome === 'SKIPPED') && unclassified.items.every((item) => item.mistakeType === null) && category.items.some((item) => item.mistakeType === 'TIME_PRESSURE') && subject.total === mistakesAll.total, 'Mistake Bank filters failed.');
    const mistakePage = data<Page<MistakeItem>>(await request('/api/mistakes?page=1&pageSize=1&outcome=ALL&mistakeType=ALL'));
    assert(mistakePage.items.length === 1 && mistakePage.totalPages === mistakePage.total, 'Mistake Bank pagination failed.');

    const eligible = mistakesAll.items.filter((item) => item.retryEligible && [ids.skippedNat, ids.wrongOne].includes(item.questionId));
    const seen = new Set<string>();
    const uniqueIds = eligible.flatMap((item) => seen.has(item.questionId) ? [] : (seen.add(item.questionId), [item.questionId]));
    assert(uniqueIds.length === 2, 'Retry question deduplication failed.');
    const retryTest = await createTest('Temporary V1.10 Mistake Retry', uniqueIds);
    const retryDetail = data<{ testType: string; totalMarks: number; questionCount: number; questions: Array<{ id: string }> }>(await request(`/api/tests/${retryTest}`));
    assert(retryDetail.testType === 'CUSTOM' && retryDetail.questionCount === 2 && retryDetail.totalMarks === 2 && retryDetail.questions.map((item) => item.id).join(',') === uniqueIds.join(','), 'Retry CUSTOM test contract failed.');
    const retryStart = await start(retryTest);
    assert((await request(`/api/attempts/${retryStart.id}`)).response.status === 200, 'Retry test did not open in the existing Test Engine.');
    const archivedRetry = await request('/api/tests', { method: 'POST', ...json({ name: 'Forbidden archived retry', testType: 'CUSTOM', durationMinutes: 10, questionIds: [ids.wrongMsq] }) });
    assert(archivedRetry.response.status === 409, 'Archived retry bypassed existing test creation rules.');

    const filteredHistory = data<Page<ResultItem>>(await request(`/api/results?testType=CUSTOM&testId=${mainTest}&page=1&pageSize=1`));
    assert(filteredHistory.items.length === 1 && filteredHistory.items[0]?.testId === mainTest && filteredHistory.total >= 4, 'Result history filters or pagination failed.');
    const orderedHistory = data<Page<ResultItem>>(await request(`/api/results?testId=${mainTest}&page=1&pageSize=100`)).items;
    assert(orderedHistory.every((item, index) => index === 0 || item.submittedAt <= orderedHistory[index - 1]!.submittedAt), 'Result history ordering failed.');
    assert(mistakesAll.items.every((item, index) => index === 0 || item.submittedAt <= mistakesAll.items[index - 1]!.submittedAt), 'Mistake Bank ordering failed.');
    assert((await request('/api/results?page=1&pageSize=20&unknown=1')).response.status === 400 && (await request('/api/mistakes?page=1&pageSize=20&unknown=1')).response.status === 400, 'Strict result query validation failed.');
  } finally {
    let cleanupFailed = false;
    for (const id of attempts) try { await deleteAttemptRow(id); } catch { cleanupFailed = true; }
    for (const id of tests) try { await deleteTestRow(id); } catch { cleanupFailed = true; }
    for (const id of questions) {
      try {
        await removeQuestionImage(id);
        for (const path of await listQuestionImageObjects(id)) await removeQuestionImageObject(path);
        await deleteQuestionRowForCleanup(id);
      } catch { cleanupFailed = true; }
    }
    for (const id of attempts) if (await findAttemptRow(id)) cleanupFailed = true;
    for (const id of tests) if (await findTestRow(id) || (await findTestQuestions(id)).length) cleanupFailed = true;
    for (const id of questions) if (await findQuestionRow(id) || (await listQuestionImageObjects(id)).length) cleanupFailed = true;
    const afterTests = data<Page<{ id: string }>>(await request('/api/tests?page=1&pageSize=100')).items.map((item) => item.id).sort();
    if (afterTests.join(',') !== baselineTests.join(',')) cleanupFailed = true;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (cleanupFailed) throw new Error('Results verifier cleanup failed.');
  }
  console.log(JSON.stringify({ status: 'PASS', pureCases: 8, realDatabase: true, resultsApis: 4, correctWrongSkipped: true, zeroAttemptAccuracy: 0, negativeScore: -1, resultReadMutationSafety: true, activeLeakage: 0, attemptLeakage: 0, resultListLeakage: 0, classifications: 7, mistakeFilters: 5, repeatedHistory: true, archivedHistory: true, retryCustomTest: true, temporaryRowsRemoved: true, temporaryStorageObjectsRemoved: true, permanentVerifierMutations: 0 }, null, 2));
}

async function main(): Promise<void> {
  runPureVerification();
  if (process.argv.includes('--pure')) {
    console.log(JSON.stringify({ status: 'PASS', mode: 'pure', cases: 8, outcomes: 3, mistakeTypes: 7 }, null, 2));
    return;
  }
  await runIntegrationVerification();
}

main().catch((error: unknown) => {
  console.error(`Results verification failed: ${error instanceof Error ? error.message : 'Unknown error.'}`);
  process.exitCode = 1;
});
