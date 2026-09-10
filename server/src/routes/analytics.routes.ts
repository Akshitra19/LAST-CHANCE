import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { getAnalytics } from '../services/analytics.service.js';
import { analyticsQuerySchema } from '../validation/analytics.schemas.js';

export const analyticsRouter = Router();

analyticsRouter.get('/', async (request, response, next) => {
  try {
    const parsed = analyticsQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Analytics filters are invalid.');
    response.json({ data: await getAnalytics(parsed.data) });
  } catch (error) { next(error); }
});
