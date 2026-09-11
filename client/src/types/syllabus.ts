export const topicStatuses = ['NOT_STARTED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'MASTERED', 'WEAK'] as const;
export type TopicStatus = typeof topicStatuses[number];
export const topicStatusLabels: Record<TopicStatus, string> = { NOT_STARTED: 'Not Started', LEARNING: 'Learning', PRACTICING: 'Practicing', PYQ: 'PYQ', REVISING: 'Revising', MASTERED: 'Mastered', WEAK: 'Weak' };

export interface SyllabusTopic { id: string; code: string; name: string; status: TopicStatus; parentTopicId: string | null; depth: number; displayOrder: number; isOfficial: boolean; leafCount: number; masteredLeafCount: number; weakLeafCount: number; children: SyllabusTopic[]; }
export interface SyllabusSubject { id: string; code: string; paperCode: string; name: string; displayOrder: number; isOfficial: boolean; topics: SyllabusTopic[]; }
export interface SyllabusData { version: 'GATE_2027'; subjectCount: number; topicCount: number; officialTopicCount: number; studySubtopicCount: number; totalNodeCount: number; actionableLeafCount: number; subjects: SyllabusSubject[]; }
export interface TopicStatusResult { id: string; code: string; name: string; status: TopicStatus; updatedAt: string; }
