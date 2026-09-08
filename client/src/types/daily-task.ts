export const dailyTaskTypes = ['THEORY', 'PRACTICE', 'PYQ', 'REVISION', 'TEST', 'MATH', 'APTITUDE'] as const;
export const dailyTaskStatuses = ['TODO', 'DONE', 'SKIPPED'] as const;
export type DailyTaskType = typeof dailyTaskTypes[number];
export type DailyTaskStatus = typeof dailyTaskStatuses[number];
export const dailyTaskTypeLabels: Record<DailyTaskType, string> = { THEORY: 'Theory', PRACTICE: 'Practice', PYQ: 'PYQ', REVISION: 'Revision', TEST: 'Test', MATH: 'Mathematics', APTITUDE: 'Aptitude' };
export const dailyTaskStatusLabels: Record<DailyTaskStatus, string> = { TODO: 'To Do', DONE: 'Done', SKIPPED: 'Skipped' };
export interface TaskReference { id: string; code: string; name: string; }
export interface DailyTask { id: string; taskDate: string; taskType: DailyTaskType; plannedMinutes: number; actualMinutes: number | null; status: DailyTaskStatus; startedAt: string | null; completedAt: string | null; notes: string | null; subject: TaskReference | null; topic: TaskReference | null; createdAt: string; updatedAt: string; }
export interface CreateDailyTaskInput { taskDate: string; taskType: DailyTaskType; plannedMinutes: number; subjectId?: string | null; topicId?: string | null; notes?: string | null; }
export type UpdateDailyTaskInput = Partial<CreateDailyTaskInput & { actualMinutes: number | null; status: DailyTaskStatus }>;
