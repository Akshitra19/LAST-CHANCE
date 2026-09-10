import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { getResult, listMistakes, listResults, updateMistakeType } from '../services/results.service.js';
import { listMistakesQuerySchema, listResultsQuerySchema, mistakePatchSchema, resultIdSchema } from '../validation/results.schemas.js';

export const resultsRouter = Router();
export const mistakesRouter = Router();

const invalid = (message: string) => new AppError(400, 'VALIDATION_ERROR', message);
const id = (value: string) => {
  const parsed = resultIdSchema.safeParse(value);
  if (!parsed.success) throw invalid('Identifier is invalid.');
  return parsed.data;
};

resultsRouter.get('/', async (request, response, next) => {
  try {
    const parsed = listResultsQuerySchema.safeParse(request.query);
    if (!parsed.success) throw invalid('Result filters are invalid.');
    response.json({ data: await listResults(parsed.data) });
  } catch (error) { next(error); }
});

resultsRouter.get('/:attemptId', async (request, response, next) => {
  try { response.json({ data: await getResult(id(request.params.attemptId)) }); }
  catch (error) { next(error); }
});

resultsRouter.patch('/:attemptId/questions/:questionId/mistake', async (request, response, next) => {
  try {
    const parsed = mistakePatchSchema.safeParse(request.body);
    if (!parsed.success) throw invalid('Mistake classification is invalid.');
    response.json({ data: await updateMistakeType(id(request.params.attemptId), id(request.params.questionId), parsed.data.mistakeType) });
  } catch (error) { next(error); }
});

mistakesRouter.get('/', async (request, response, next) => {
  try {
    const parsed = listMistakesQuerySchema.safeParse(request.query);
    if (!parsed.success) throw invalid('Mistake filters are invalid.');
    response.json({ data: await listMistakes(parsed.data) });
  } catch (error) { next(error); }
});
