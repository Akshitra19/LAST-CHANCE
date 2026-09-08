import { AppError } from '../errors/app-error.js';
import { fetchOfficialSubjects, fetchOfficialTopics, updateTopicStatus, type TopicRow } from '../repositories/syllabus.repository.js';
import type { TopicStatusPatch } from '../validation/topics.schemas.js';

type TopicNode = { id: string; code: string; name: string; status: string; parentTopicId: string | null; depth: number; displayOrder: number; isOfficial: boolean; children: TopicNode[] };

function compareTopics(a: TopicNode, b: TopicNode): number { return a.displayOrder - b.displayOrder || a.code.localeCompare(b.code); }

function buildHierarchy(topics: TopicRow[], subjectId: string): TopicNode[] {
  const rows = topics.filter((topic) => topic.subject_id === subjectId);
  const rowsById = new Map(rows.map((topic) => [topic.id, topic]));
  const nodes = new Map<string, TopicNode>(rows.map((topic) => [topic.id, { id: topic.id, code: topic.code, name: topic.name, status: topic.preparation_status, parentTopicId: topic.parent_topic_id, depth: 0, displayOrder: topic.display_order, isOfficial: topic.is_official, children: [] }]));
  const roots: TopicNode[] = [];
  for (const topic of rows) {
    const node = nodes.get(topic.id)!;
    if (!topic.parent_topic_id) { roots.push(node); continue; }
    const parent = rowsById.get(topic.parent_topic_id);
    if (!parent || parent.subject_id !== subjectId) throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', 'Syllabus hierarchy is invalid.');
    nodes.get(parent.id)!.children.push(node);
  }
  const visit = (node: TopicNode, ancestors: Set<string>, depth: number): void => {
    if (ancestors.has(node.id)) throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', 'Syllabus hierarchy contains a cycle.');
    node.depth = depth; node.children.sort(compareTopics);
    const next = new Set(ancestors); next.add(node.id);
    node.children.forEach((child) => visit(child, next, depth + 1));
  };
  roots.sort(compareTopics).forEach((root) => visit(root, new Set(), 0));
  return roots;
}

export async function getSyllabus() {
  const [subjects, topics] = await Promise.all([fetchOfficialSubjects(), fetchOfficialTopics()]);
  if (subjects.length !== 11 || topics.length !== 173 || new Set(subjects.map((subject) => subject.code)).size !== subjects.length || new Set(topics.map((topic) => topic.code)).size !== topics.length) throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', 'Syllabus data is incomplete or inconsistent.');
  const subjectIds = new Set(subjects.map((subject) => subject.id));
  if (topics.some((topic) => !subjectIds.has(topic.subject_id))) throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', 'Syllabus hierarchy is invalid.');
  return { version: 'GATE_2027', subjectCount: subjects.length, topicCount: topics.length, subjects: subjects.map((subject) => ({ id: subject.id, code: subject.code, paperCode: subject.source_paper_code, name: subject.name, displayOrder: subject.display_order, isOfficial: subject.is_official, topics: buildHierarchy(topics, subject.id) })) };
}

export async function patchTopicStatus(id: string, patch: TopicStatusPatch) {
  const topic = await updateTopicStatus(id, { preparation_status: patch.status, updated_at: new Date().toISOString() });
  if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic was not found.');
  return { id: topic.id, code: topic.code, name: topic.name, status: topic.preparation_status, updatedAt: topic.updated_at };
}
