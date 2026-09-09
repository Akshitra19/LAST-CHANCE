import { env } from '../config/env.js';
import { getSupabaseClient } from '../config/supabase.js';
import type { Json } from '../types/database.types.js';

const requiredTables = [
  'app_settings',
  'subjects',
  'topics',
  'questions',
  'question_options',
  'daily_tasks',
  'tests',
  'test_questions',
  'attempts',
  'answers'
] as const;

const expectedCsSubjectCodes = new Set([
  'CS-S1-ENGINEERING-MATHEMATICS',
  'CS-S2-DIGITAL-LOGIC',
  'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE',
  'CS-S4-PROGRAMMING-DATA-STRUCTURES',
  'CS-S5-ALGORITHMS',
  'CS-S6-THEORY-COMPUTATION',
  'CS-S7-COMPILER-DESIGN',
  'CS-S8-OPERATING-SYSTEM',
  'CS-S9-DATABASES',
  'CS-S10-COMPUTER-NETWORKS'
]);

const allowedStatuses = new Set([
  'NOT_STARTED',
  'LEARNING',
  'PRACTICING',
  'PYQ',
  'REVISING',
  'MASTERED',
  'WEAK'
]);

interface SubjectRow {
  id: string;
  code: string;
  syllabus_version: string;
  source_paper_code: string;
  is_official: boolean;
}

interface TopicRow {
  id: string;
  subject_id: string;
  parent_topic_id: string | null;
  code: string;
  syllabus_version: string;
  preparation_status: string;
  is_official: boolean;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function assertAcyclic(topics: readonly TopicRow[]): void {
  const byId = new Map(topics.map((topic) => [topic.id, topic]));
  for (const topic of topics) {
    const visited = new Set<string>();
    let current: TopicRow | undefined = topic;
    while (current?.parent_topic_id) {
      assert(!visited.has(current.id), `Cycle detected from topic ${topic.code}.`);
      visited.add(current.id);
      current = byId.get(current.parent_topic_id);
    }
  }
}

async function verifyMarksAwardedContract(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  subjectId: string,
  topicId: string
): Promise<void> {
  let questionId: string | null = null;
  let testId: string | null = null;
  let attemptId: string | null = null;
  let answerId: string | null = null;
  let verificationError: unknown;
  try {
    const question = await client.from('questions').insert({
      subject_id: subjectId, topic_id: topicId, question_text: 'Temporary V1.9 schema verifier',
      question_type: 'MCQ', marks: 1, correct_answer: { optionKeys: ['A'] } as Json
    }).select('id').single();
    assert(!question.error && question.data, 'Could not create temporary scoring-schema question.');
    questionId = question.data.id;
    const test = await client.from('tests').insert({ name: 'Temporary V1.9 schema verifier', test_type: 'CUSTOM', duration_minutes: 1, total_marks: 1 }).select('id').single();
    assert(!test.error && test.data, 'Could not create temporary scoring-schema test.');
    testId = test.data.id;
    const link = await client.from('test_questions').insert({ test_id: testId, question_id: questionId, position: 1 });
    assert(!link.error, 'Could not create temporary scoring-schema test link.');
    const attempt = await client.from('attempts').insert({ test_id: testId, status: 'IN_PROGRESS' }).select('id').single();
    assert(!attempt.error && attempt.data, 'Could not create temporary scoring-schema attempt.');
    attemptId = attempt.data.id;
    const answer = await client.from('answers').insert({ attempt_id: attemptId, question_id: questionId, submitted_answer: { optionKeys: ['B'] } as Json }).select('id,marks_awarded').single();
    assert(!answer.error && answer.data, 'Could not create temporary scoring-schema answer.');
    assert(answer.data.marks_awarded === null, 'answers.marks_awarded must allow NULL.');
    answerId = answer.data.id;

    const third = await client.from('answers').update({ marks_awarded: -0.333333 }).eq('id', answerId).select('marks_awarded').single();
    assert(!third.error && third.data?.marks_awarded === -0.333333, 'answers.marks_awarded must preserve six-decimal negative thirds.');
    const lowerBound = await client.from('answers').update({ marks_awarded: -0.666667 }).eq('id', answerId).select('marks_awarded').single();
    assert(!lowerBound.error && lowerBound.data?.marks_awarded === -0.666667, 'answers.marks_awarded must accept the canonical lower bound.');
    const oneMark = await client.from('answers').update({ marks_awarded: 1 }).eq('id', answerId).select('marks_awarded').single();
    assert(!oneMark.error && oneMark.data?.marks_awarded === 1, 'answers.marks_awarded must accept one mark.');
    const upperBound = await client.from('answers').update({ marks_awarded: 2 }).eq('id', answerId).select('marks_awarded').single();
    assert(!upperBound.error && upperBound.data?.marks_awarded === 2, 'answers.marks_awarded must accept the canonical upper bound.');
    const tooLow = await client.from('answers').update({ marks_awarded: -0.666668 }).eq('id', answerId);
    assert(Boolean(tooLow.error), 'answers.marks_awarded accepted a value below the canonical lower bound.');
    const tooHigh = await client.from('answers').update({ marks_awarded: 2.000001 }).eq('id', answerId);
    assert(Boolean(tooHigh.error), 'answers.marks_awarded accepted a value above the canonical upper bound.');
  } catch (error) {
    verificationError = error;
  } finally {
    let cleanupFailed = false;
    if (attemptId) { const result = await client.from('attempts').delete().eq('id', attemptId); cleanupFailed ||= Boolean(result.error); }
    if (testId) { const result = await client.from('tests').delete().eq('id', testId); cleanupFailed ||= Boolean(result.error); }
    if (questionId) { const result = await client.from('questions').delete().eq('id', questionId); cleanupFailed ||= Boolean(result.error); }
    if (answerId) { const result = await client.from('answers').select('id').eq('id', answerId).maybeSingle(); cleanupFailed ||= Boolean(result.error || result.data); }
    if (cleanupFailed) throw new Error('Scoring-schema verifier cleanup failed.');
  }
  if (verificationError) throw verificationError;
}

async function main(): Promise<void> {
  assert(env.supabaseUrl, 'SUPABASE_URL is required.');
  assert(env.supabaseSecretKey, 'SUPABASE_SECRET_KEY is required.');
  assert(env.supabaseSecretKeyValid, 'SUPABASE_SECRET_KEY must use the modern sb_secret_ format.');

  const client = getSupabaseClient();
  assert(client, 'Supabase client could not be initialized.');

  for (const table of requiredTables) {
    const { error } = await client.from(table).select('*', { count: 'exact', head: true }).limit(1);
    assert(!error, `Table ${table} is not queryable: ${error?.message ?? 'unknown error'}`);
  }

  const settingsResult = await client.from('app_settings').select('singleton_key');
  assert(!settingsResult.error, `Could not read app settings: ${settingsResult.error?.message ?? 'unknown error'}`);
  assert(settingsResult.data?.length === 1 && settingsResult.data[0]?.singleton_key === 'default',
    'Expected exactly the app_settings/default singleton.');

  const subjectsResult = await client
    .from('subjects')
    .select('id,code,syllabus_version,source_paper_code,is_official')
    .eq('syllabus_version', 'GATE_2027');
  assert(!subjectsResult.error, `Could not read subjects: ${subjectsResult.error?.message ?? 'unknown error'}`);
  const subjects = (subjectsResult.data ?? []) as SubjectRow[];
  assert(subjects.length === 11, `Expected 11 subjects, found ${subjects.length}.`);
  assert(findDuplicates(subjects.map((subject) => subject.code)).length === 0, 'Duplicate subject codes found.');
  assert(subjects.every((subject) => subject.is_official), 'All seeded subjects must be official.');
  assert(subjects.some((subject) => subject.code === 'GA' && subject.source_paper_code === 'GA'), 'GA subject missing.');
  const csCodes = new Set(subjects.filter((subject) => subject.source_paper_code === 'CS').map((subject) => subject.code));
  assert(csCodes.size === 10 && [...expectedCsSubjectCodes].every((code) => csCodes.has(code)),
    'The ten official CS sections are incomplete.');

  const topicsResult = await client
    .from('topics')
    .select('id,subject_id,parent_topic_id,code,syllabus_version,preparation_status,is_official')
    .eq('syllabus_version', 'GATE_2027');
  assert(!topicsResult.error, `Could not read topics: ${topicsResult.error?.message ?? 'unknown error'}`);
  const topics = (topicsResult.data ?? []) as TopicRow[];
  assert(topics.length === 173, `Expected 173 topics, found ${topics.length}.`);
  assert(findDuplicates(topics.map((topic) => topic.code)).length === 0, 'Duplicate topic codes found.');
  assert(topics.every((topic) => topic.is_official), 'All seeded topics must be official.');
  assert(topics.every((topic) => allowedStatuses.has(topic.preparation_status)), 'Invalid topic status found.');

  const subjectIds = new Set(subjects.map((subject) => subject.id));
  const topicById = new Map(topics.map((topic) => [topic.id, topic]));
  for (const topic of topics) {
    assert(subjectIds.has(topic.subject_id), `Topic ${topic.code} has a missing subject.`);
    if (topic.parent_topic_id) {
      const parent = topicById.get(topic.parent_topic_id);
      assert(parent, `Topic ${topic.code} has a missing parent.`);
      assert(parent.subject_id === topic.subject_id, `Topic ${topic.code} has a cross-subject parent.`);
    }
  }
  assertAcyclic(topics);
  await verifyMarksAwardedContract(client, topics[0]!.subject_id, topics[0]!.id);

  console.log(JSON.stringify({
    status: 'PASS',
    tables: requiredTables.length,
    subjects: subjects.length,
    topics: topics.length,
    duplicateSubjectCodes: 0,
    duplicateTopicCodes: 0,
    brokenParents: 0,
    cycles: 0,
    scoringMarksPrecision: 6,
    scoringMarksBounds: [-0.666667, 2],
    scoringMarksNullAllowed: true,
    scoringMarksAccepted: [-0.333333, -0.666667, 1, 2],
    temporaryRowsRemoved: true
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database verification error.';
  console.error(`Database verification failed: ${message}`);
  process.exitCode = 1;
});
