import { topicStatuses, type SyllabusData, type SyllabusTopic, type TopicStatus } from '../types/syllabus';

export type StatusCounts = Record<TopicStatus, number>;

export function countSyllabusStatuses(syllabus: SyllabusData): { total: number; counts: StatusCounts } {
  const counts = Object.fromEntries(topicStatuses.map((status) => [status, 0])) as StatusCounts;
  const seen = new Set<string>();
  const visit = (topic: SyllabusTopic): void => {
    if (seen.has(topic.id)) throw new Error('Duplicate syllabus topic.');
    seen.add(topic.id);
    if (topic.children.length === 0) counts[topic.status] += 1;
    topic.children.forEach(visit);
  };
  syllabus.subjects.forEach((subject) => subject.topics.forEach(visit));
  if (seen.size !== syllabus.totalNodeCount) throw new Error('Syllabus node count mismatch.');
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  if (total !== syllabus.actionableLeafCount) throw new Error('Syllabus actionable-leaf count mismatch.');
  return { total, counts };
}
