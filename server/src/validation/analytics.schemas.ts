import { z } from 'zod';
import { analyticsRanges, analyticsTestTypes } from '../domain/analytics.js';

const single = <T extends z.ZodTypeAny>(schema: T) => z.preprocess((value) => Array.isArray(value) ? Symbol('repeated') : value, schema);

export const analyticsQuerySchema = z.object({
  range: single(z.enum(analyticsRanges)).optional().default('30D'),
  testType: single(z.enum(analyticsTestTypes)).optional().default('ALL')
}).strict();

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
