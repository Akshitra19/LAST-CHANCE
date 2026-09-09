import { app } from '../app.js';
import { scoreAttempt, scoreQuestion, ScoringIntegrityError, type ScoringQuestion } from '../domain/scoring.js';
import { AppError } from '../errors/app-error.js';
import { getSupabaseClient } from '../config/supabase.js';
import { backdateAttemptForVerification, deleteAttemptRow, findAnswerScoringState, findAttemptRow } from '../repositories/attempts.repository.js';
import { deleteQuestionRowForCleanup, findQuestionRow } from '../repositories/questions.repository.js';
import { deleteTestRow, findTestQuestions, findTestRow } from '../repositories/tests.repository.js';
import { ensureAttemptScored } from '../services/scoring.service.js';

type Result = { response: Response; body: unknown };
type AttemptPayload = { id: string; status: string; submittedAt: string | null; questions: Array<{ id: string }> };
type ExpectedAnswer = { isCorrect: boolean | null; marksAwarded: number };

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}

function optionQuestion(overrides: Partial<ScoringQuestion> = {}): ScoringQuestion {
  return { id: 'q', questionType: 'MCQ', marks: 1, correctAnswer: { optionKeys: ['A'] }, optionKeys: ['A', 'B', 'C'], submittedAnswer: { optionKeys: ['A'] }, ...overrides };
}

function natQuestion(overrides: Partial<ScoringQuestion> = {}): ScoringQuestion {
  return { id: 'nat', questionType: 'NAT', marks: 1, correctAnswer: { min: -1.5, max: 2.25 }, optionKeys: [], submittedAnswer: { value: 1 }, ...overrides };
}

function expectIntegrity(work: () => unknown, label: string): void {
  let rejected = false;
  try { work(); } catch (error) { rejected = error instanceof ScoringIntegrityError; }
  assert(rejected, `${label} was not rejected as a scoring integrity error.`);
}

function runPureVerification(): void {
  const cases: Array<[string, ScoringQuestion, ExpectedAnswer]> = [
    ['MCQ 1 correct', optionQuestion(), { isCorrect: true, marksAwarded: 1 }],
    ['MCQ 1 wrong', optionQuestion({ submittedAnswer: { optionKeys: ['B'] } }), { isCorrect: false, marksAwarded: -0.333333 }],
    ['MCQ 1 skipped', optionQuestion({ submittedAnswer: { optionKeys: [] } }), { isCorrect: null, marksAwarded: 0 }],
    ['MCQ 2 correct', optionQuestion({ marks: 2 }), { isCorrect: true, marksAwarded: 2 }],
    ['MCQ 2 wrong', optionQuestion({ marks: 2, submittedAnswer: { optionKeys: ['B'] } }), { isCorrect: false, marksAwarded: -0.666667 }],
    ['MCQ 2 skipped', optionQuestion({ marks: 2, submittedAnswer: { optionKeys: [] } }), { isCorrect: null, marksAwarded: 0 }],
    ['MSQ exact unordered', optionQuestion({ questionType: 'MSQ', correctAnswer: { optionKeys: ['A', 'C'] }, submittedAnswer: { optionKeys: ['C', 'A'] } }), { isCorrect: true, marksAwarded: 1 }],
    ['MSQ partial', optionQuestion({ questionType: 'MSQ', correctAnswer: { optionKeys: ['A', 'C'] }, submittedAnswer: { optionKeys: ['A'] } }), { isCorrect: false, marksAwarded: 0 }],
    ['MSQ extra', optionQuestion({ questionType: 'MSQ', correctAnswer: { optionKeys: ['A', 'C'] }, submittedAnswer: { optionKeys: ['A', 'B', 'C'] } }), { isCorrect: false, marksAwarded: 0 }],
    ['MSQ wrong', optionQuestion({ questionType: 'MSQ', correctAnswer: { optionKeys: ['A', 'C'] }, submittedAnswer: { optionKeys: ['B'] } }), { isCorrect: false, marksAwarded: 0 }],
    ['MSQ skipped', optionQuestion({ questionType: 'MSQ', correctAnswer: { optionKeys: ['A', 'C'] }, submittedAnswer: { optionKeys: [] } }), { isCorrect: null, marksAwarded: 0 }],
    ['NAT exact', natQuestion({ correctAnswer: { min: 2, max: 2 }, submittedAnswer: { value: 2 } }), { isCorrect: true, marksAwarded: 1 }],
    ['NAT lower boundary', natQuestion({ submittedAnswer: { value: -1.5 } }), { isCorrect: true, marksAwarded: 1 }],
    ['NAT upper boundary', natQuestion({ submittedAnswer: { value: 2.25 } }), { isCorrect: true, marksAwarded: 1 }],
    ['NAT negative decimal', natQuestion({ correctAnswer: { min: -2.75, max: -2.5 }, submittedAnswer: { value: -2.625 } }), { isCorrect: true, marksAwarded: 1 }],
    ['NAT wrong', natQuestion({ submittedAnswer: { value: 2.250001 } }), { isCorrect: false, marksAwarded: 0 }],
    ['NAT skipped', natQuestion({ submittedAnswer: { value: null } }), { isCorrect: null, marksAwarded: 0 }]
  ];
  for (const [label, question, expected] of cases) {
    const actual = scoreQuestion(question);
    assert(actual.isCorrect === expected.isCorrect && actual.marksAwarded === expected.marksAwarded, `${label} failed.`);
  }

  const threeWrong = scoreAttempt([0, 1, 2].map((index) => optionQuestion({ id: `wrong-${index}`, submittedAnswer: { optionKeys: ['B'] } })));
  assert(threeWrong.totalUnits === -3 && threeWrong.score === -1, 'Three wrong 1-mark MCQs must total exactly -1.00.');
  const twoWrong = scoreAttempt([0, 1].map((index) => optionQuestion({ id: `two-${index}`, submittedAnswer: { optionKeys: ['B'] } })));
  assert(twoWrong.totalUnits === -2 && twoWrong.score === -0.67, 'Two wrong 1-mark MCQs must round once to -0.67.');
  const mixed = scoreAttempt([
    optionQuestion({ id: 'mixed-correct' }),
    optionQuestion({ id: 'mixed-wrong-two', marks: 2, submittedAnswer: { optionKeys: ['B'] } }),
    optionQuestion({ id: 'mixed-wrong-one', submittedAnswer: { optionKeys: ['B'] } })
  ]);
  assert(mixed.totalUnits === 0 && mixed.score === 0, 'Mixed exact-unit aggregation failed.');

  expectIntegrity(() => scoreQuestion(optionQuestion({ submittedAnswer: { optionKeys: ['A', 'A'] } })), 'Duplicate submitted options');
  expectIntegrity(() => scoreQuestion(optionQuestion({ submittedAnswer: { optionKeys: ['Z'] } })), 'Unknown submitted option');
  expectIntegrity(() => scoreQuestion(optionQuestion({ correctAnswer: { optionKeys: [] } })), 'Empty correct answer');
  expectIntegrity(() => scoreQuestion(optionQuestion({ correctAnswer: { optionKeys: ['Z'] } })), 'Unknown correct option');
  expectIntegrity(() => scoreQuestion(optionQuestion({ optionKeys: ['A', 'A'] })), 'Duplicate canonical options');
  expectIntegrity(() => scoreQuestion(optionQuestion({ submittedAnswer: { optionKeys: ['A'], extra: true } })), 'Extra submitted field');
  expectIntegrity(() => scoreQuestion(natQuestion({ correctAnswer: { min: 2, max: 1 } })), 'Reversed NAT range');
  expectIntegrity(() => scoreQuestion(natQuestion({ submittedAnswer: { value: Number.NaN } })), 'Non-finite NAT submission');
  expectIntegrity(() => scoreAttempt([]), 'Empty attempt');
  expectIntegrity(() => scoreAttempt([optionQuestion({ id: 'same' }), optionQuestion({ id: 'same' })]), 'Duplicate attempt question');
}

async function runIntegrationVerification(): Promise<void> {
  const db = getSupabaseClient();
  assert(db, 'Real Supabase configuration is required for scoring integration verification.');
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string', 'Server bind failed.');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (path: string, options: RequestInit = {}): Promise<Result> => {
    const response = await fetch(base + path, options);
    const body: unknown = response.status === 204 ? null : await response.json();
    return { response, body };
  };
  const json = (body: unknown): RequestInit => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const data = <T>(result: Result) => (result.body as { data: T }).data;
  const forbidden = /correctAnswer|correct_answer|explanation|isCorrect|is_correct|marksAwarded|marks_awarded/;
  const safe = (result: Result, label: string) => assert(!forbidden.test(JSON.stringify(result.body)), `${label} leaked scoring or answer-key fields.`);
  const questions: string[] = [];
  const tests: string[] = [];
  const attempts: string[] = [];
  let baselineTests: string[] = [];

  try {
    baselineTests = data<{ items: Array<{ id: string }> }>(await request('/api/tests?page=1&pageSize=100')).items.map((item) => item.id).sort();
    const syllabus = data<{ subjects: Array<{ id: string; topics: Array<{ id: string }> }> }>(await request('/api/syllabus'));
    const scope = syllabus.subjects[0];
    assert(scope?.topics[0], 'A seeded syllabus topic is required.');
    const common = { subjectId: scope.id, topicId: scope.topics[0].id, difficulty: 'MEDIUM', year: 2026, source: 'Temporary V1.9 verifier', explanation: 'Private scoring verifier explanation' };
    const makeQuestion = async (name: string, body: Record<string, unknown>): Promise<string> => {
      const created = await request('/api/questions', { method: 'POST', ...json({ ...common, questionText: `Temporary V1.9 ${name}`, ...body }) });
      assert(created.response.status === 201, `Could not create ${name}.`);
      const id = data<{ id: string }>(created).id;
      questions.push(id);
      return id;
    };
    const mcq = (marks = 1) => ({ questionType: 'MCQ', marks, options: [{ key: 'A', text: 'Correct' }, { key: 'B', text: 'Wrong' }, { key: 'C', text: 'Other' }], correctAnswer: { optionKeys: ['A'] } });
    const msq = { questionType: 'MSQ', marks: 1, options: [{ key: 'A', text: 'Correct A' }, { key: 'B', text: 'Wrong' }, { key: 'C', text: 'Correct C' }], correctAnswer: { optionKeys: ['A', 'C'] } };
    const ids = {
      mcqCorrect: await makeQuestion('MCQ correct', mcq()),
      mcqWrong: await makeQuestion('MCQ wrong', mcq()),
      mcqTwoWrong: await makeQuestion('MCQ two-mark wrong', mcq(2)),
      msqExact: await makeQuestion('MSQ exact', msq),
      msqPartial: await makeQuestion('MSQ partial', msq),
      natExact: await makeQuestion('NAT exact', { questionType: 'NAT', marks: 1, options: [], correctAnswer: { min: 4, max: 4 } }),
      natBoundary: await makeQuestion('NAT boundary', { questionType: 'NAT', marks: 1, options: [], correctAnswer: { min: -2.5, max: 1.25 } }),
      natWrong: await makeQuestion('NAT wrong', { questionType: 'NAT', marks: 1, options: [], correctAnswer: { min: -1, max: 1 } }),
      mcqSkip: await makeQuestion('MCQ skipped', mcq()),
      msqSkip: await makeQuestion('MSQ skipped', msq),
      natSkip: await makeQuestion('NAT skipped', { questionType: 'NAT', marks: 1, options: [], correctAnswer: { min: 0, max: 0 } }),
      reviewOff: await makeQuestion('review off', mcq()),
      reviewOn: await makeQuestion('review on', mcq()),
      timeLow: await makeQuestion('time low', mcq()),
      timeHigh: await makeQuestion('time high', mcq()),
      outsider: await makeQuestion('off-test integrity', mcq())
    };

    const createTest = async (name: string, questionIds: string[]): Promise<string> => {
      const created = await request('/api/tests', { method: 'POST', ...json({ name, testType: 'CUSTOM', durationMinutes: 10, questionIds }) });
      assert(created.response.status === 201, `Could not create ${name}.`);
      const id = data<{ id: string }>(created).id;
      tests.push(id);
      return id;
    };
    const mainQuestionIds = Object.values(ids).filter((id) => id !== ids.outsider);
    const mainTest = await createTest('Temporary V1.9 scoring test', mainQuestionIds);
    const negativeTest = await createTest('Temporary V1.9 negative score test', [ids.mcqCorrect, ids.mcqWrong, ids.reviewOff]);

    const start = async (testId: string): Promise<AttemptPayload> => {
      const result = await request(`/api/tests/${testId}/attempts`, { method: 'POST' });
      assert(result.response.status === 201, 'Attempt creation failed.');
      safe(result, 'Start Attempt');
      const attempt = data<AttemptPayload>(result);
      attempts.push(attempt.id);
      await backdateAttemptForVerification(attempt.id, new Date(Date.now() - 120_000).toISOString());
      return attempt;
    };
    const save = async (attemptId: string, questionId: string, submittedAnswer: unknown, markedForReview = false, timeSeconds = 0): Promise<Result> => {
      const result = await request(`/api/attempts/${attemptId}/answers/${questionId}`, { method: 'PUT', ...json({ submittedAnswer, markedForReview, timeSeconds }) });
      assert(result.response.status === 200, `Saving answer ${questionId} failed.`);
      safe(result, 'PUT Answer');
      return result;
    };
    const directSubmit = async (attemptId: string): Promise<void> => {
      const submittedAt = new Date().toISOString();
      const { error } = await db.from('attempts').update({ status: 'SUBMITTED', submitted_at: submittedAt, total_time_seconds: 120, score: null }).eq('id', attemptId).eq('status', 'IN_PROGRESS');
      if (error) throw error;
    };

    const main = await start(mainTest);
    const expected = new Map<string, ExpectedAnswer>([
      [ids.mcqCorrect, { isCorrect: true, marksAwarded: 1 }],
      [ids.mcqWrong, { isCorrect: false, marksAwarded: -0.333333 }],
      [ids.mcqTwoWrong, { isCorrect: false, marksAwarded: -0.666667 }],
      [ids.msqExact, { isCorrect: true, marksAwarded: 1 }],
      [ids.msqPartial, { isCorrect: false, marksAwarded: 0 }],
      [ids.natExact, { isCorrect: true, marksAwarded: 1 }],
      [ids.natBoundary, { isCorrect: true, marksAwarded: 1 }],
      [ids.natWrong, { isCorrect: false, marksAwarded: 0 }],
      [ids.mcqSkip, { isCorrect: null, marksAwarded: 0 }],
      [ids.msqSkip, { isCorrect: null, marksAwarded: 0 }],
      [ids.natSkip, { isCorrect: null, marksAwarded: 0 }],
      [ids.reviewOff, { isCorrect: true, marksAwarded: 1 }],
      [ids.reviewOn, { isCorrect: true, marksAwarded: 1 }],
      [ids.timeLow, { isCorrect: true, marksAwarded: 1 }],
      [ids.timeHigh, { isCorrect: true, marksAwarded: 1 }]
    ]);
    await save(main.id, ids.mcqCorrect, { optionKeys: ['A'] });
    await save(main.id, ids.mcqWrong, { optionKeys: ['B'] });
    await save(main.id, ids.mcqTwoWrong, { optionKeys: ['B'] });
    await save(main.id, ids.msqExact, { optionKeys: ['C', 'A'] });
    await save(main.id, ids.msqPartial, { optionKeys: ['A'] });
    await save(main.id, ids.natExact, { value: 4 });
    await save(main.id, ids.natBoundary, { value: 1.25 });
    await save(main.id, ids.natWrong, { value: 2 });
    await save(main.id, ids.reviewOff, { optionKeys: ['A'] }, false, 5);
    await save(main.id, ids.reviewOn, { optionKeys: ['A'] }, true, 5);
    await save(main.id, ids.timeLow, { optionKeys: ['A'] }, false, 5);
    await save(main.id, ids.timeHigh, { optionKeys: ['A'] }, false, 30);
    assert((await request(`/api/questions/${ids.natExact}`, { method: 'PATCH', ...json({ archived: true }) })).response.status === 200, 'Archived question setup failed.');
    const before = await findAnswerScoringState(main.id);
    const submitResult = await request(`/api/attempts/${main.id}/submit`, { method: 'POST' });
    assert(submitResult.response.status === 200, `Manual submission/scoring failed; apply the V1.9 marks migration if negative marks are rejected.`);
    safe(submitResult, 'Submit');
    const submitted = data<AttemptPayload>(submitResult);
    assert(submitted.status === 'SUBMITTED' && submitted.submittedAt, 'Manual submission did not remain final.');
    const mainRow = await findAttemptRow(main.id);
    const scored = await findAnswerScoringState(main.id);
    assert(mainRow?.score === 7, `Expected exact aggregate score 7.00, found ${mainRow?.score}.`);
    for (const answer of scored) {
      const value = expected.get(answer.question_id);
      assert(value && answer.is_correct === value.isCorrect && answer.marks_awarded === value.marksAwarded, `Persisted scoring mismatch for ${answer.question_id}.`);
      const original = before.find((item) => item.question_id === answer.question_id);
      assert(original && JSON.stringify(answer.submitted_answer) === JSON.stringify(original.submitted_answer) && answer.time_seconds === original.time_seconds && answer.marked_for_review === original.marked_for_review && answer.updated_at === original.updated_at, 'Scoring mutated an answer source field or timestamp.');
    }
    assert(scored.find((item) => item.question_id === ids.reviewOff)?.marks_awarded === scored.find((item) => item.question_id === ids.reviewOn)?.marks_awarded, 'Review changed scoring.');
    assert(scored.find((item) => item.question_id === ids.timeLow)?.marks_awarded === scored.find((item) => item.question_id === ids.timeHigh)?.marks_awarded, 'Time changed scoring.');

    const ordered = (answers: Awaited<ReturnType<typeof findAnswerScoringState>>) => [...answers].sort((left, right) => left.question_id.localeCompare(right.question_id));
    const idempotentBefore = JSON.stringify({ score: mainRow.score, answers: ordered(scored) });
    await ensureAttemptScored(main.id);
    const idempotentAfter = JSON.stringify({ score: (await findAttemptRow(main.id))?.score, answers: ordered(await findAnswerScoringState(main.id)) });
    assert(idempotentBefore === idempotentAfter, 'Repeated scoring was not idempotent.');
    assert((await request(`/api/attempts/${main.id}/answers/${ids.mcqCorrect}`, { method: 'PUT', ...json({ submittedAnswer: { optionKeys: ['B'] }, markedForReview: false, timeSeconds: 5 }) })).response.status === 409, 'Scoring weakened submitted-answer immutability.');
    assert((await request(`/api/tests/${mainTest}`, { method: 'PATCH', ...json({ name: 'Forbidden edit' }) })).response.status === 409, 'Scoring weakened the test lock.');
    assert((await request(`/api/tests/${mainTest}`, { method: 'DELETE' })).response.status === 409, 'Scoring weakened the test delete lock.');
    assert((await request(`/api/questions/${ids.mcqCorrect}`, { method: 'PATCH', ...json({ questionText: 'Forbidden edit' }) })).response.status === 409, 'Scoring weakened the question lock.');
    for (const [label, result] of [
      ['GET Tests', await request('/api/tests?page=1&pageSize=100')],
      ['GET Test', await request(`/api/tests/${mainTest}`)],
      ['GET Attempt', await request(`/api/attempts/${main.id}`)],
      ['Repeat Submit', await request(`/api/attempts/${main.id}/submit`, { method: 'POST' })]
    ] as const) safe(result, label);

    const negative = await start(negativeTest);
    for (const questionId of [ids.mcqCorrect, ids.mcqWrong, ids.reviewOff]) await save(negative.id, questionId, { optionKeys: ['B'] });
    const negativeSubmit = await request(`/api/attempts/${negative.id}/submit`, { method: 'POST' });
    assert(negativeSubmit.response.status === 200, 'Negative-score submission failed.');
    const negativeRow = await findAttemptRow(negative.id);
    const negativeAnswers = await findAnswerScoringState(negative.id);
    assert(negativeRow?.score === -1 && negativeAnswers.every((answer) => answer.is_correct === false && answer.marks_awarded === -0.333333), 'Negative score or exact-third persistence failed.');

    const legacy = await start(negativeTest);
    await save(legacy.id, ids.mcqCorrect, { optionKeys: ['A'] }, true, 7);
    await directSubmit(legacy.id);
    const legacyBefore = await findAnswerScoringState(legacy.id);
    const legacySubmittedAt = (await findAttemptRow(legacy.id))?.submitted_at;
    await ensureAttemptScored(legacy.id);
    assert((await findAttemptRow(legacy.id))?.score === 1 && (await findAttemptRow(legacy.id))?.submitted_at === legacySubmittedAt, 'Legacy submitted attempt recovery failed.');
    const legacyAfter = await findAnswerScoringState(legacy.id);
    const legacyInputs = new Map(legacyBefore.map((answer) => [answer.question_id, JSON.stringify(answer.submitted_answer)]));
    assert(legacyAfter.every((answer) => JSON.stringify(answer.submitted_answer) === legacyInputs.get(answer.question_id)), 'Legacy recovery changed submitted answers.');

    const partial = await start(negativeTest);
    for (const questionId of [ids.mcqCorrect, ids.mcqWrong, ids.reviewOff]) await save(partial.id, questionId, { optionKeys: ['B'] });
    await directSubmit(partial.id);
    const partialAnswers = await findAnswerScoringState(partial.id);
    const { error: partialError } = await db.from('answers').update({ is_correct: true, marks_awarded: 2 }).eq('id', partialAnswers[0]!.id);
    if (partialError) throw partialError;
    await ensureAttemptScored(partial.id);
    assert((await findAttemptRow(partial.id))?.score === -1 && (await findAnswerScoringState(partial.id)).every((answer) => answer.is_correct === false && answer.marks_awarded === -0.333333), 'Partial-score recovery failed.');

    const missing = await start(negativeTest);
    await directSubmit(missing.id);
    const missingAnswers = await findAnswerScoringState(missing.id);
    const { error: deleteError } = await db.from('answers').delete().eq('id', missingAnswers[0]!.id);
    if (deleteError) throw deleteError;
    let missingRejected = false;
    try { await ensureAttemptScored(missing.id); } catch (error) { missingRejected = error instanceof AppError && error.code === 'SCORING_INTEGRITY_ERROR'; }
    assert(missingRejected && (await findAttemptRow(missing.id))?.score === null, 'Missing-answer integrity failure did not preserve a null score.');

    const offTest = await start(negativeTest);
    await directSubmit(offTest.id);
    const offTestAnswers = await findAnswerScoringState(offTest.id);
    const { error: membershipError } = await db.from('answers').update({ question_id: ids.outsider }).eq('id', offTestAnswers[0]!.id);
    if (membershipError) throw membershipError;
    let membershipRejected = false;
    try { await ensureAttemptScored(offTest.id); } catch (error) { membershipRejected = error instanceof AppError && error.code === 'SCORING_INTEGRITY_ERROR'; }
    assert(membershipRejected && (await findAttemptRow(offTest.id))?.score === null, 'Off-test answer integrity failure did not preserve a null score.');
  } finally {
    let cleanupFailed = false;
    for (const id of attempts) try { await deleteAttemptRow(id); } catch { cleanupFailed = true; }
    for (const id of tests) try { await deleteTestRow(id); } catch { cleanupFailed = true; }
    for (const id of questions) try { await deleteQuestionRowForCleanup(id); } catch { cleanupFailed = true; }
    for (const id of attempts) if (await findAttemptRow(id)) cleanupFailed = true;
    for (const id of tests) if (await findTestRow(id) || (await findTestQuestions(id)).length) cleanupFailed = true;
    for (const id of questions) if (await findQuestionRow(id)) cleanupFailed = true;
    const afterTests = data<{ items: Array<{ id: string }> }>(await request('/api/tests?page=1&pageSize=100')).items.map((item) => item.id).sort();
    if (afterTests.join(',') !== baselineTests.join(',')) cleanupFailed = true;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (cleanupFailed) throw new Error('Scoring verifier cleanup failed.');
  }

  console.log(JSON.stringify({
    status: 'PASS', pureCases: 27, mcq: true, msqExactSet: true, msqPartialMarks: false,
    natInclusiveRange: true, skippedSemantics: true, exactThirdUnits: true,
    threeWrongMcqScore: -1, negativeScorePersisted: true, idempotent: true,
    legacyRecovery: true, partialRecovery: true, integrityFailures: 2,
    manualSubmissionScored: true, answerLeakage: 0, temporaryRowsRemoved: true,
    permanentVerifierMutations: 0
  }, null, 2));
}

async function main(): Promise<void> {
  runPureVerification();
  if (process.argv.includes('--pure')) {
    console.log(JSON.stringify({ status: 'PASS', mode: 'pure', cases: 27, exactThirdUnits: true, threeWrongMcqScore: -1 }, null, 2));
    return;
  }
  await runIntegrationVerification();
}

main().catch((error: unknown) => {
  console.error(`Scoring verification failed: ${error instanceof Error ? error.message : 'Unknown error.'}`);
  process.exitCode = 1;
});
