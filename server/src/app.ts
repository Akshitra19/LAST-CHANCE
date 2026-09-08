import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ['GET'],
    optionsSuccessStatus: 204
  })
);
app.use(express.json({ limit: '32kb' }));

app.use('/api/health', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);
