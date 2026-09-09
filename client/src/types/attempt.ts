import type { QuestionRef, QuestionType } from './question';
import type { TestType } from './test';

export type OptionSubmittedAnswer = { optionKeys: string[] };
export type NatSubmittedAnswer = { value: number | null };
export type SubmittedAnswer = OptionSubmittedAnswer | NatSubmittedAnswer;
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED';
export type AttemptQuestion = { id:string;position:number;questionText:string;questionType:QuestionType;marks:1|2;subject:QuestionRef|null;topic:QuestionRef|null;options:Array<{key:string;text:string}>;hasImage:boolean;submittedAnswer:SubmittedAnswer;markedForReview:boolean;timeSeconds:number };
export type TestAttempt = { id:string;status:AttemptStatus;startedAt:string;expiresAt:string;serverNow:string;submittedAt:string|null;totalTimeSeconds:number|null;remainingSeconds:number;test:{id:string;name:string;testType:TestType;durationMinutes:number;totalMarks:number;questionCount:number};questions:AttemptQuestion[] };
export type SaveAttemptAnswerInput = { submittedAnswer:SubmittedAnswer;markedForReview:boolean;timeSeconds:number };
export type SavedAttemptAnswer = SaveAttemptAnswerInput & { attemptId:string;questionId:string;savedAt:string;serverNow:string;remainingSeconds:number;status:AttemptStatus };
