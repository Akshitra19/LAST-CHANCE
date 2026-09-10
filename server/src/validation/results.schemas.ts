import { z } from 'zod';
import { mistakeTypes } from '../domain/results.js';
import { testTypes } from './tests.schemas.js';

const uuid = z.string().uuid();
const integerQuery = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const pagination = {
  page: integerQuery(1, Number.MAX_SAFE_INTEGER).optional().default(1),
  pageSize: integerQuery(1, 100).optional().default(20)
};

export const listResultsQuerySchema = z.object({
  ...pagination,
  testType: z.enum(testTypes).optional(),
  testId: uuid.optional()
}).strict();

export const listMistakesQuerySchema = z.object({
  ...pagination,
  outcome: z.enum(['ALL', 'WRONG', 'SKIPPED']).optional().default('ALL'),
  mistakeType: z.union([z.literal('ALL'), z.literal('UNCLASSIFIED'), z.enum(mistakeTypes)]).optional().default('ALL'),
  subjectId: uuid.optional()
}).strict();

export const mistakePatchSchema = z.object({ mistakeType: z.enum(mistakeTypes).nullable() }).strict();
export const resultIdSchema = uuid;

export type ListResultsQuery = z.infer<typeof listResultsQuerySchema>;
export type ListMistakesQuery = z.infer<typeof listMistakesQuerySchema>;
export type MistakePatch = z.infer<typeof mistakePatchSchema>;
