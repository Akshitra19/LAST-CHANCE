import { z } from 'zod';

const uuid = z.string().uuid();
const optionAnswer = z.object({ optionKeys: z.array(z.string().trim().min(1).max(32)).max(100) }).strict();
const numericAnswer = z.object({ value: z.number().finite().nullable() }).strict();

export const attemptIdSchema = uuid;
export const attemptQuestionIdSchema = uuid;
export const saveAttemptAnswerSchema = z.object({
  submittedAnswer: z.union([optionAnswer, numericAnswer]),
  markedForReview: z.boolean(),
  timeSeconds: z.number().int().min(0).max(36_000)
}).strict();

export type SaveAttemptAnswer = z.infer<typeof saveAttemptAnswerSchema>;
