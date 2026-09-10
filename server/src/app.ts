import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { syllabusRouter } from './routes/syllabus.routes.js';
import { topicsRouter } from './routes/topics.routes.js';
import { dailyTasksRouter } from './routes/daily-tasks.routes.js';
import { questionsRouter } from './routes/questions.routes.js';
import { testsRouter } from './routes/tests.routes.js';
import { attemptsRouter } from './routes/attempts.routes.js';
import { mistakesRouter, resultsRouter } from './routes/results.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    optionsSuccessStatus: 204
  })
);
app.use(express.json({ limit: '32kb' }));

app.use('/api/health', healthRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/syllabus', syllabusRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/daily-tasks', dailyTasksRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/tests', testsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/mistakes', mistakesRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api', attemptsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
