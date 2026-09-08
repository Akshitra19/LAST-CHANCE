import { Router } from 'express';
import { getSyllabus } from '../services/syllabus.service.js';
export const syllabusRouter = Router();
syllabusRouter.get('/', async (_request, response, next) => { try { response.json({ data: await getSyllabus() }); } catch (error) { next(error); } });
