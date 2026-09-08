import { env } from '../config/env.js';
import { getSupabaseClient } from '../config/supabase.js';

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

  console.log(JSON.stringify({
    status: 'PASS',
    tables: requiredTables.length,
    subjects: subjects.length,
    topics: topics.length,
    duplicateSubjectCodes: 0,
    duplicateTopicCodes: 0,
    brokenParents: 0,
    cycles: 0
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown database verification error.';
  console.error(`Database verification failed: ${message}`);
  process.exitCode = 1;
});
