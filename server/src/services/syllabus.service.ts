import { actionableLeafRows, buildSubjectHierarchy, SyllabusGraphError, validateSyllabusGraph } from '../domain/syllabus.js';
import { AppError } from '../errors/app-error.js';
import { fetchOfficialSubjects, fetchSyllabusTopics, topicHasChildren, updateTopicStatus } from '../repositories/syllabus.repository.js';
import type { TopicStatusPatch } from '../validation/topics.schemas.js';

export async function getSyllabus() {
  const [subjects, topics] = await Promise.all([fetchOfficialSubjects(), fetchSyllabusTopics()]);
  const officialTopics = topics.filter((topic) => topic.is_official);
  const studySubtopics = topics.filter((topic) => !topic.is_official);
  if (subjects.length !== 11 || officialTopics.length !== 173 || new Set(subjects.map((subject) => subject.code)).size !== subjects.length) {
    throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', 'Official syllabus data is incomplete or inconsistent.');
  }
  try { validateSyllabusGraph(topics, new Set(subjects.map((subject) => subject.id))); }
  catch (error) {
    if (error instanceof SyllabusGraphError) throw new AppError(500, 'SYLLABUS_INTEGRITY_ERROR', error.message);
    throw error;
  }
  const leafCount = actionableLeafRows(topics).length;
  return {
    version: 'GATE_2027', subjectCount: subjects.length, topicCount: officialTopics.length,
    officialTopicCount: officialTopics.length, studySubtopicCount: studySubtopics.length,
    totalNodeCount: topics.length, actionableLeafCount: leafCount,
    subjects: subjects.map((subject) => ({
      id: subject.id, code: subject.code, paperCode: subject.source_paper_code, name: subject.name,
      displayOrder: subject.display_order, isOfficial: subject.is_official,
      topics: buildSubjectHierarchy(topics, subject.id)
    }))
  };
}

export async function patchTopicStatus(id: string, patch: TopicStatusPatch) {
  if (await topicHasChildren(id)) throw new AppError(409, 'TOPIC_STATUS_DERIVED', 'A parent topic status is derived from its actionable leaves.');
  const topic = await updateTopicStatus(id, { preparation_status: patch.status, updated_at: new Date().toISOString() });
  if (!topic) throw new AppError(404, 'TOPIC_NOT_FOUND', 'Topic was not found.');
  return { id: topic.id, code: topic.code, name: topic.name, status: topic.preparation_status, updatedAt: topic.updated_at };
}
