import express, { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { downloadQuestionImage, questionImageMaxBytes, removeQuestionImage, replaceQuestionImage } from '../services/question-storage.js';
import { createQuestion, getQuestion, listQuestions, updateQuestion } from '../services/questions.service.js';
import { createQuestionSchema, listQuestionsQuerySchema, questionIdSchema, updateQuestionSchema } from '../validation/questions.schemas.js';

export const questionsRouter = Router();
const invalid = (message: string) => new AppError(400, 'VALIDATION_ERROR', message);
const parseId = (value: string) => { const result = questionIdSchema.safeParse(value); if (!result.success) throw invalid('Question identifier is invalid.'); return result.data; };
const imageBody = express.raw({ type: () => true, limit: questionImageMaxBytes + 1 });

questionsRouter.get('/', async (request, response, next) => { try { const parsed = listQuestionsQuerySchema.safeParse(request.query); if (!parsed.success) throw invalid('Question filters are invalid.'); response.json({ data: await listQuestions(parsed.data) }); } catch (error) { next(error); } });
questionsRouter.post('/', async (request, response, next) => { try { const parsed = createQuestionSchema.safeParse(request.body); if (!parsed.success) throw invalid('Question details are invalid.'); response.status(201).json({ data: await createQuestion(parsed.data) }); } catch (error) { next(error); } });
questionsRouter.get('/:questionId/image', async (request, response, next) => { try { const image = await downloadQuestionImage(parseId(request.params.questionId)); response.setHeader('Content-Type', image.contentType); response.setHeader('Cache-Control', 'private, max-age=300'); response.send(image.body); } catch (error) { next(error); } });
questionsRouter.put('/:questionId/image', imageBody, async (request, response, next) => { try { if (!Buffer.isBuffer(request.body)) throw invalid('Image body is invalid.'); response.json({ data: await replaceQuestionImage(parseId(request.params.questionId), request.body, request.headers['content-type']) }); } catch (error) { next(error); } });
questionsRouter.delete('/:questionId/image', async (request, response, next) => { try { await removeQuestionImage(parseId(request.params.questionId)); response.status(204).end(); } catch (error) { next(error); } });
questionsRouter.get('/:questionId', async (request, response, next) => { try { response.json({ data: await getQuestion(parseId(request.params.questionId)) }); } catch (error) { next(error); } });
questionsRouter.patch('/:questionId', async (request, response, next) => { try { const parsed = updateQuestionSchema.safeParse(request.body); if (!parsed.success) throw invalid('Question update is invalid.'); response.json({ data: await updateQuestion(parseId(request.params.questionId), parsed.data) }); } catch (error) { next(error); } });
