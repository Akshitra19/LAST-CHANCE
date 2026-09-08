import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { syllabusRouter } from './routes/syllabus.routes.js';
import { topicsRouter } from './routes/topics.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET', 'PATCH'],
    optionsSuccessStatus: 204
  })
);
app.use(express.json({ limit: '32kb' }));

app.use('/api/health', healthRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/syllabus', syllabusRouter);
app.use('/api/topics', topicsRouter);

app.use(notFoundHandler);
app.use(errorHandler);
