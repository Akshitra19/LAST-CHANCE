import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type SqlScalar = string | number | null;

interface SubjectSeed {
  code: string;
  paperCode: string;
}

interface TopicSeed {
  subjectCode: string;
  parentCode: string | null;
  code: string;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function extractValues(sql: string, cteName: string): string {
  const start = sql.indexOf(`with ${cteName} (`);
  assert(start >= 0, `Missing ${cteName} CTE.`);
  const valuesStart = sql.indexOf('values', start) + 'values'.length;
  const valuesEnd = sql.indexOf('\n)\ninsert into', valuesStart);
  assert(valuesEnd >= 0, `Could not find the end of ${cteName}.`);
  return sql.slice(valuesStart, valuesEnd);
}

function parseTuples(input: string): SqlScalar[][] {
  const tuples: SqlScalar[][] = [];
  let tuple: string[] = [];
  let value = '';
  let inString = false;
  let depth = 0;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const next = input[index + 1];
    if (character === "'" && inString && next === "'") {
      value += "'";
      index += 1;
    } else if (character === "'") {
      inString = !inString;
    } else if (!inString && character === '(') {
      if (depth === 0) {
        tuple = [];
        value = '';
      } else {
        value += character;
      }
      depth += 1;
    } else if (!inString && character === ')' && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        tuple.push(value.trim());
        tuples.push(tuple.map(parseScalar));
      } else {
        value += character;
      }
    } else if (!inString && character === ',' && depth === 1) {
      tuple.push(value.trim());
      value = '';
    } else if (depth > 0) {
      value += character;
    }
  }
  return tuples;
}

function parseScalar(value: string): SqlScalar {
  const clean = value.replace(/::[a-z]+$/i, '').trim();
  if (clean === 'null') return null;
  if (/^-?\d+$/.test(clean)) return Number(clean);
  return clean;
}

function text(value: SqlScalar, label: string): string {
  assert(typeof value === 'string', `${label} must be text.`);
  return value;
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

async function main(): Promise<void> {
  const seedPath = resolve(process.cwd(), '..', 'supabase', 'seed.sql');
  const sql = await readFile(seedPath, 'utf8');
  const subjectRows = parseTuples(extractValues(sql, 'subject_seed'));
  const rootRows = parseTuples(extractValues(sql, 'root_topic_seed'));
  const childRows = parseTuples(extractValues(sql, 'child_topic_seed'));

  const subjects: SubjectSeed[] = subjectRows.map((row) => ({
    code: text(row[0] ?? null, 'subject code'),
    paperCode: text(row[1] ?? null, 'paper code')
  }));
  const roots: TopicSeed[] = rootRows.map((row) => ({
    subjectCode: text(row[0] ?? null, 'root subject code'),
    parentCode: null,
    code: text(row[1] ?? null, 'root code')
  }));
  const children: TopicSeed[] = childRows.map((row) => ({
    subjectCode: text(row[0] ?? null, 'child subject code'),
    parentCode: text(row[1] ?? null, 'parent code'),
    code: text(row[2] ?? null, 'child code')
  }));
  const topics = [...roots, ...children];

  assert(subjects.length === 11, `Expected 11 subjects, found ${subjects.length}.`);
  assert(topics.length === 173, `Expected 173 topics, found ${topics.length}.`);
  assert(duplicates(subjects.map((subject) => subject.code)).length === 0, 'Duplicate subject code found.');
  assert(duplicates(topics.map((topic) => topic.code)).length === 0, 'Duplicate topic code found.');
  assert(subjects.filter((subject) => subject.paperCode === 'GA').length === 1, 'Expected one GA subject.');
  assert(subjects.filter((subject) => subject.paperCode === 'CS').length === 10, 'Expected ten CS subjects.');

  const subjectsByCode = new Set(subjects.map((subject) => subject.code));
  const topicsByCode = new Map(topics.map((topic) => [topic.code, topic]));
  for (const topic of topics) {
    assert(subjectsByCode.has(topic.subjectCode), `Missing subject for ${topic.code}.`);
    if (topic.parentCode) {
      const parent = topicsByCode.get(topic.parentCode);
      assert(parent, `Missing parent for ${topic.code}.`);
      assert(parent.subjectCode === topic.subjectCode, `Cross-subject parent for ${topic.code}.`);
    }
  }

  assert(sql.includes("on conflict (singleton_key) do nothing;"), 'Settings seed must preserve user changes.');
  assert(!/^  preparation_status = excluded/m.test(sql), 'Topic upsert must preserve progress.');
  assert((sql.match(/^on conflict /gm) ?? []).length === 4, 'Expected four idempotent upsert clauses.');

  console.log(JSON.stringify({
    status: 'PASS',
    subjects: subjects.length,
    topics: topics.length,
    rootTopics: roots.length,
    childTopics: children.length,
    duplicateCodes: 0,
    brokenParents: 0,
    crossSubjectParents: 0,
    settingsPreserved: true,
    topicProgressPreserved: true
  }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed validation error.';
  console.error(`Seed validation failed: ${message}`);
  process.exitCode = 1;
});
