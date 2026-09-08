import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { patchTopicStatus } from '../services/syllabus.service.js';
import { topicIdSchema, topicStatusSchema } from '../validation/topics.schemas.js';
export const topicsRouter = Router();
topicsRouter.patch('/:topicId/status', async (request, response, next) => { try { const id = topicIdSchema.safeParse(request.params.topicId); if (!id.success) throw new AppError(400, 'VALIDATION_ERROR', 'Topic identifier is invalid.'); const body = topicStatusSchema.safeParse(request.body); if (!body.success) throw new AppError(400, 'VALIDATION_ERROR', 'Topic status update is invalid.'); response.json({ data: await patchTopicStatus(id.data, body.data) }); } catch (error) { next(error); } });
