import { z } from 'zod';

export const testTypes = ['TOPIC', 'CUSTOM', 'FULL_MOCK'] as const;
const uuid = z.string().uuid();
const questionIds = z.array(uuid).min(1).max(100).superRefine((ids, context) => { if (new Set(ids).size !== ids.length) context.addIssue({ code: 'custom', message: 'Question IDs must be unique.' }); });
const fields = { name: z.string().trim().min(1).max(200), testType: z.enum(testTypes), durationMinutes: z.number().int().min(1).max(600).optional(), questionIds, topicId: uuid.optional() };
function validateContract(value: { testType?: typeof testTypes[number] | undefined; durationMinutes?: number | undefined; topicId?: string | undefined }, context: z.RefinementCtx) {
  if ((value.testType === 'TOPIC' || value.testType === 'CUSTOM') && value.durationMinutes === undefined) context.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Duration is required.' });
  if (value.testType === 'TOPIC' && !value.topicId) context.addIssue({ code: 'custom', path: ['topicId'], message: 'Topic is required.' });
  if (value.testType !== undefined && value.testType !== 'TOPIC' && value.topicId !== undefined) context.addIssue({ code: 'custom', path: ['topicId'], message: 'Topic scope is only valid for Topic tests.' });
  if (value.testType === 'FULL_MOCK' && value.durationMinutes !== undefined && value.durationMinutes !== 180) context.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Full Mock duration must be 180 minutes.' });
}
export const createTestSchema = z.object(fields).strict().superRefine(validateContract);
export const updateTestSchema = z.object({ name: fields.name.optional(), testType: fields.testType.optional(), durationMinutes: fields.durationMinutes, questionIds: questionIds.optional(), topicId: fields.topicId }).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required.').superRefine(validateContract);
const integerQuery = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
export const listTestsQuerySchema = z.object({ page: integerQuery(1, Number.MAX_SAFE_INTEGER).optional().default(1), pageSize: integerQuery(1, 100).optional().default(20), testType: z.enum(testTypes).optional() }).strict();
export const testIdSchema = uuid;
export type CreateTest = z.infer<typeof createTestSchema>;
export type UpdateTest = z.infer<typeof updateTestSchema>;
export type ListTestsQuery = z.infer<typeof listTestsQuerySchema>;
