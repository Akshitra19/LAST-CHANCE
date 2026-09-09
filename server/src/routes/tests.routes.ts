import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { createTest, getTest, listTests, removeTest, updateTest } from '../services/tests.service.js';
import { createTestSchema, listTestsQuerySchema, testIdSchema, updateTestSchema } from '../validation/tests.schemas.js';

export const testsRouter=Router();const invalid=(message:string)=>new AppError(400,'VALIDATION_ERROR',message);const id=(value:string)=>{const parsed=testIdSchema.safeParse(value);if(!parsed.success)throw invalid('Test identifier is invalid.');return parsed.data};
testsRouter.get('/',async(request,response,next)=>{try{const parsed=listTestsQuerySchema.safeParse(request.query);if(!parsed.success)throw invalid('Test filters are invalid.');response.json({data:await listTests(parsed.data)})}catch(error){next(error)}});
testsRouter.post('/',async(request,response,next)=>{try{const parsed=createTestSchema.safeParse(request.body);if(!parsed.success)throw invalid('Test definition is invalid.');response.status(201).json({data:await createTest(parsed.data)})}catch(error){next(error)}});
testsRouter.get('/:testId',async(request,response,next)=>{try{response.json({data:await getTest(id(request.params.testId))})}catch(error){next(error)}});
testsRouter.patch('/:testId',async(request,response,next)=>{try{const parsed=updateTestSchema.safeParse(request.body);if(!parsed.success)throw invalid('Test update is invalid.');response.json({data:await updateTest(id(request.params.testId),parsed.data)})}catch(error){next(error)}});
testsRouter.delete('/:testId',async(request,response,next)=>{try{await removeTest(id(request.params.testId));response.status(204).end()}catch(error){next(error)}});
