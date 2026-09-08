import { z } from 'zod';

export const topicIdSchema = z.string().uuid();

export const topicStatusSchema = z.object({
  status: z.enum(['NOT_STARTED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'MASTERED', 'WEAK'])
}).strict();

export type TopicStatusPatch = z.infer<typeof topicStatusSchema>;
