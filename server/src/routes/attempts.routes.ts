import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { getAttempt, saveAttemptAnswer, startAttempt, submitAttempt } from '../services/attempts.service.js';
import { attemptIdSchema, attemptQuestionIdSchema, saveAttemptAnswerSchema } from '../validation/attempts.schemas.js';
import { testIdSchema } from '../validation/tests.schemas.js';

export const attemptsRouter = Router();
const invalid = (message: string) => new AppError(400, 'VALIDATION_ERROR', message);
const id = (value: string, schema = attemptIdSchema) => { const parsed = schema.safeParse(value); if (!parsed.success) throw invalid('Identifier is invalid.'); return parsed.data; };

attemptsRouter.post('/tests/:testId/attempts', async (request, response, next) => { try { const result = await startAttempt(id(request.params.testId, testIdSchema)); response.status(result.created ? 201 : 200).json({ data: result.data }); } catch (error) { next(error); } });
attemptsRouter.get('/attempts/:attemptId', async (request, response, next) => { try { response.json({ data: await getAttempt(id(request.params.attemptId)) }); } catch (error) { next(error); } });
attemptsRouter.put('/attempts/:attemptId/answers/:questionId', async (request, response, next) => { try { const parsed = saveAttemptAnswerSchema.safeParse(request.body); if (!parsed.success) throw invalid('Attempt answer is invalid.'); response.json({ data: await saveAttemptAnswer(id(request.params.attemptId), id(request.params.questionId, attemptQuestionIdSchema), parsed.data) }); } catch (error) { next(error); } });
attemptsRouter.post('/attempts/:attemptId/submit', async (request, response, next) => { try { response.json({ data: await submitAttempt(id(request.params.attemptId)) }); } catch (error) { next(error); } });
