import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { actionableLeafRows, buildSubjectHierarchy, SyllabusGraphError, validateSyllabusGraph, type SyllabusTopicRow } from '../server/src/domain/syllabus.js';
import { studyHoursForToday } from '../client/src/lib/date-only.js';
import { studyTargetHours } from '../client/src/lib/study-target.js';
import { buildTopicPath } from '../server/src/domain/topic-path.js';

type PrepChild = { name: string; code: string; displayOrder: number; existingOfficialCode: string | null };
type PrepManifest = { syllabusVersion: string; rawItemCount: number; expectedPrepTopicCount: number; groups: Array<{ parentCode: string; children: PrepChild[] }> };
type Lane = { description: string; subjectCode: string; topicCode: string | null; taskType: string; plannedMinutes: number; timeBlock: string };
type PlanManifest = { planKey: string; startDate: string; endDate: string; weekdayHolidayOverrides: string[]; days: Array<{ date: string; lanes: { cs: Lane; math: Lane; ga: Lane } }> };

const root = resolve(import.meta.dirname, '..');
const readJson = <T>(path: string): T => JSON.parse(readFileSync(resolve(root, path), 'utf8')) as T;
const read = (path: string): string => readFileSync(resolve(root, path), 'utf8');
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const iso = (date: Date): string => date.toISOString().slice(0, 10);

function graphRow(overrides: Partial<SyllabusTopicRow> & Pick<SyllabusTopicRow, 'id' | 'code'>): SyllabusTopicRow {
  return { subject_id: 'subject-a', parent_topic_id: null, name: overrides.code, preparation_status: 'NOT_STARTED', display_order: 1, is_official: true, syllabus_version: 'GATE_2027', ...overrides };
}

function verifyHierarchyDomain(): void {
  const officialOnly = [graphRow({ id: 'official-root', code: 'OFFICIAL-ROOT' })];
  validateSyllabusGraph(officialOnly, new Set(['subject-a']));
  assert(actionableLeafRows(officialOnly).length === 1, 'The zero-preparation-topic state is not supported.');
  const rows = [
    graphRow({ id: 'root', code: 'ROOT' }),
    graphRow({ id: 'branch', code: 'BRANCH', parent_topic_id: 'root', is_official: false }),
    graphRow({ id: 'mastered', code: 'MASTERED', parent_topic_id: 'branch', is_official: false, preparation_status: 'MASTERED' }),
    graphRow({ id: 'weak', code: 'WEAK', parent_topic_id: 'branch', is_official: false, preparation_status: 'WEAK' })
  ];
  validateSyllabusGraph(rows, new Set(['subject-a']));
  const rootNode = buildSubjectHierarchy(rows, 'subject-a')[0];
  assert(rootNode?.leafCount === 2 && rootNode.masteredLeafCount === 1 && rootNode.weakLeafCount === 1 && rootNode.status === 'WEAK', 'Derived parent progress is incorrect.');
  assert(actionableLeafRows(rows).map((row) => row.id).sort().join(',') === 'mastered,weak', 'Actionable-leaf detection is incorrect.');
  let rootRejected = false;
  try { validateSyllabusGraph([graphRow({ id: 'prep-root', code: 'PREP', is_official: false })], new Set(['subject-a'])); } catch (error) { rootRejected = error instanceof SyllabusGraphError; }
  assert(rootRejected, 'Preparation root was not rejected.');
  let cycleRejected = false;
  try { validateSyllabusGraph([graphRow({ id: 'a', code: 'A', parent_topic_id: 'b' }), graphRow({ id: 'b', code: 'B', parent_topic_id: 'a' })], new Set(['subject-a'])); } catch (error) { cycleRejected = error instanceof SyllabusGraphError; }
  assert(cycleRejected, 'Multi-node hierarchy cycle was not rejected.');
  const pathRows = new Map<string, { id: string; name: string; parent_topic_id: string | null }>([
    ['root', { id: 'root', name: 'Programming in C', parent_topic_id: null }],
    ['leaf', { id: 'leaf', name: 'Pointer arithmetic', parent_topic_id: 'root' }]
  ]);
  assert(buildTopicPath(pathRows.get('leaf')!, 'Programming and Data Structures', pathRows) === 'Programming and Data Structures › Programming in C › Pointer arithmetic', 'Full topic breadcrumb is incorrect.');
}

function main(): void {
  const prep = readJson<PrepManifest>('scripts/data/gate-2027-preparation-manifest.json');
  const plan = readJson<PlanManifest>('scripts/data/gate-2027-first-pass-plan.json');
  const schemaSql = read('supabase/migrations/20260911114328_add_study_plan_schema.sql');
  const prepSql = read('supabase/migrations/20260911114334_add_gate_2027_preparation_topics.sql');
  const planSql = read('supabase/migrations/20260911114338_add_gate_2027_first_pass_plan.sql');
  const officialSql = read('supabase/seed.sql');

  const rawChildren = prep.groups.flatMap((group) => group.children.map((child) => ({ ...child, parentCode: group.parentCode })));
  const effectiveChildren = rawChildren.filter((child) => child.existingOfficialCode === null);
  assert(prep.syllabusVersion === 'GATE_2027' && prep.rawItemCount === 494 && rawChildren.length === 494 && prep.expectedPrepTopicCount === 493 && effectiveChildren.length === 493, 'Preparation manifest counts are incorrect.');
  assert(new Set(effectiveChildren.map((child) => child.code)).size === effectiveChildren.length, 'Preparation manifest contains duplicate effective codes.');
  assert(rawChildren.filter((child) => child.existingOfficialCode !== null).length === 1, 'Expected exactly one official-concept reuse.');
  for (const child of rawChildren) {
    assert(child.displayOrder >= 1 && child.name.trim() === child.name && child.name.length > 0, `Invalid preparation child ${child.code}.`);
    assert(officialSql.includes(`'${child.parentCode}'`), `Missing official parent ${child.parentCode}.`);
    if (child.existingOfficialCode) assert(officialSql.includes(`'${child.existingOfficialCode}'`), `Missing reused official topic ${child.existingOfficialCode}.`);
  }

  assert(plan.planKey === 'GATE2027_FIRST_PASS_20260911_20261231_V1' && plan.startDate === '2026-09-11' && plan.endDate === '2026-12-31' && plan.days.length === 112, 'Plan identity or date count is incorrect.');
  const prepCodes = new Set(effectiveChildren.map((child) => child.code));
  const overrides = new Set(plan.weekdayHolidayOverrides);
  const taskTypes = new Set(['THEORY', 'PRACTICE', 'REVISION', 'PYQ', 'TEST', 'MATH', 'APTITUDE']);
  const totals = { cs: 0, math: 0, ga: 0 };
  for (let index = 0; index < plan.days.length; index++) {
    const day = plan.days[index]!;
    const expectedDate = new Date('2026-09-11T00:00:00Z'); expectedDate.setUTCDate(expectedDate.getUTCDate() + index);
    assert(day.date === iso(expectedDate), `Plan date sequence failed at ${day.date}.`);
    const lanes = [day.lanes.cs, day.lanes.math, day.lanes.ga];
    assert(lanes.length === 3 && new Set(lanes.map((lane) => lane.subjectCode)).size === 3, `Plan lanes are invalid on ${day.date}.`);
    assert(day.lanes.cs.plannedMinutes === 180 && day.lanes.ga.plannedMinutes === 60, `CS/GA duration is incorrect on ${day.date}.`);
    const longDay = [0, 1, 6].includes(expectedDate.getUTCDay()) || overrides.has(day.date);
    assert(day.lanes.math.plannedMinutes === (longDay ? 180 : 120), `Math duration is incorrect on ${day.date}.`);
    assert(lanes.reduce((sum, lane) => sum + lane.plannedMinutes, 0) === (longDay ? 420 : 360), `Daily total is incorrect on ${day.date}.`);
    assert(day.lanes.math.subjectCode === 'CS-S1-ENGINEERING-MATHEMATICS' && day.lanes.ga.subjectCode === 'GA', `Math/GA subject lane is incorrect on ${day.date}.`);
    for (const lane of lanes) {
      assert(lane.description.trim().length > 0 && /^\d\d:\d\d–\d\d:\d\d$/.test(lane.timeBlock), `Frozen description/time block is invalid on ${day.date}.`);
      assert(taskTypes.has(lane.taskType), `Invalid task type on ${day.date}.`);
      assert(lane.topicCode === null || prepCodes.has(lane.topicCode) || officialSql.includes(`'${lane.topicCode}'`), `Plan references an unknown topic ${lane.topicCode}.`);
    }
    totals.cs += day.lanes.cs.plannedMinutes; totals.math += day.lanes.math.plannedMinutes; totals.ga += day.lanes.ga.plannedMinutes;
  }
  assert(totals.cs === 20160 && totals.math === 16500 && totals.ga === 6720 && totals.cs + totals.math + totals.ga === 43380, 'Plan minute totals are incorrect.');
  assert(new Set(plan.weekdayHolidayOverrides).size === 3 && ['2026-10-02', '2026-10-20', '2026-12-25'].every((date) => overrides.has(date)), 'Holiday overrides are incorrect.');

  const hours = { mondayStudyHours: 7, saturdayStudyHours: 8, sundayStudyHours: 9, weekdayStudyHours: 6 };
  assert(studyHoursForToday(hours, new Date(2026, 8, 14)) === 7 && studyHoursForToday(hours, new Date(2026, 8, 15)) === 6 && studyHoursForToday(hours, new Date(2026, 8, 19)) === 8 && studyHoursForToday(hours, new Date(2026, 8, 20)) === 9, 'Day-specific study hours are incorrect.');
  assert(studyTargetHours(hours, [180, 180, 60], new Date(2026, 9, 20)) === 7 && studyTargetHours(hours, [], new Date(2026, 8, 15)) === 6, 'Home task-minute target preference is incorrect.');
  assert(/add column if not exists saturday_study_hours/i.test(schemaSql) && /add column if not exists plan_key/i.test(schemaSql) && /add column if not exists plan_slot/i.test(schemaSql) && /create unique index if not exists daily_tasks_plan_key_date_slot_uidx/i.test(schemaSql) && !/create\s+table/i.test(schemaSql), 'Study-plan schema migration is not additive or lacks uniqueness.');
  assert(/Partial preparation manifest detected/i.test(prepSql) && /Syllabus hierarchy cycle detected/i.test(prepSql) && /Existing preparation rows do not match the frozen manifest/i.test(prepSql), 'Preparation migration safety/idempotency guards are incomplete.');
  assert(/Unsupported or partial legacy plan shape/i.test(planSql) && /Existing final plan does not match the frozen manifest/i.test(planSql) && /actual_minutes/i.test(planSql) && /started_at/i.test(planSql) && /completed_at/i.test(planSql) && /GATE2027_FIRST_PASS_20260911_20261231_V1/.test(planSql), 'Plan migration preservation/idempotency guards are incomplete.');
  const repositorySql = read('server/src/repositories/daily-tasks.repository.ts');
  assert(/order\('plan_slot', \{ ascending: true, nullsFirst: false \}\)/.test(repositorySql), 'Generated task ordering does not prefer plan_slot.');
  verifyHierarchyDomain();

  console.log(JSON.stringify({ status: 'PASS', preparationRaw: 494, preparationInserted: 493, planDays: 112, planRows: 336, totals: { ...totals, all: 43380 }, duplicateCodes: 0, brokenParents: 0, cycles: 0, manualTaskPlanFieldsNull: 'verified by verify:planner', generatedUniqueness: true }, null, 2));
}

main();
