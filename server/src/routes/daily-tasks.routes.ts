import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { createDailyTask, deleteDailyTask, listDailyTasks, patchDailyTask, startTimer, stopTimer } from '../services/daily-tasks.service.js';
import { createDailyTaskSchema, listTasksQuerySchema, taskIdSchema, updateDailyTaskSchema } from '../validation/daily-tasks.schemas.js';

export const dailyTasksRouter = Router();
const invalid = (message: string) => new AppError(400, 'VALIDATION_ERROR', message);
dailyTasksRouter.get('/', async (request, response, next) => { try { const parsed = listTasksQuerySchema.safeParse(request.query); if (!parsed.success) throw invalid('Task date is invalid.'); response.json({ data: await listDailyTasks(parsed.data.date) }); } catch (error) { next(error); } });
dailyTasksRouter.post('/', async (request, response, next) => { try { const parsed = createDailyTaskSchema.safeParse(request.body); if (!parsed.success) throw invalid('Task details are invalid.'); response.status(201).json({ data: await createDailyTask(parsed.data) }); } catch (error) { next(error); } });
dailyTasksRouter.patch('/:taskId', async (request, response, next) => { try { const id = taskIdSchema.safeParse(request.params.taskId); const body = updateDailyTaskSchema.safeParse(request.body); if (!id.success || !body.success) throw invalid('Task update is invalid.'); response.json({ data: await patchDailyTask(id.data, body.data) }); } catch (error) { next(error); } });
dailyTasksRouter.delete('/:taskId', async (request, response, next) => { try { const id = taskIdSchema.safeParse(request.params.taskId); if (!id.success) throw invalid('Task identifier is invalid.'); await deleteDailyTask(id.data); response.status(204).end(); } catch (error) { next(error); } });
dailyTasksRouter.post('/:taskId/timer/start', async (request, response, next) => { try { const id = taskIdSchema.safeParse(request.params.taskId); if (!id.success) throw invalid('Task identifier is invalid.'); response.json({ data: await startTimer(id.data) }); } catch (error) { next(error); } });
dailyTasksRouter.post('/:taskId/timer/stop', async (request, response, next) => { try { const id = taskIdSchema.safeParse(request.params.taskId); if (!id.success) throw invalid('Task identifier is invalid.'); response.json({ data: await stopTimer(id.data) }); } catch (error) { next(error); } });
