import { topicStatuses, type SyllabusData, type SyllabusTopic, type TopicStatus } from '../types/syllabus';

export type StatusCounts = Record<TopicStatus, number>;

export function countSyllabusStatuses(syllabus: SyllabusData): { total: number; counts: StatusCounts } {
  const counts = Object.fromEntries(topicStatuses.map((status) => [status, 0])) as StatusCounts;
  const seen = new Set<string>();
  const visit = (topic: SyllabusTopic): void => {
    if (seen.has(topic.id)) throw new Error('Duplicate syllabus topic.');
    seen.add(topic.id);
    counts[topic.status] += 1;
    topic.children.forEach(visit);
  };
  syllabus.subjects.forEach((subject) => subject.topics.forEach(visit));
  if (seen.size !== syllabus.topicCount) throw new Error('Syllabus topic count mismatch.');
  return { total: seen.size, counts };
}
