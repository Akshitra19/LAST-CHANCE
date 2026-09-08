import { Router } from 'express';
import { env } from '../config/env.js';
import { isSupabaseReachable } from '../config/supabase.js';

export const healthRouter = Router();

healthRouter.get('/', async (_request, response, next) => {
  try {
    const reachable = env.supabaseConfigured ? await isSupabaseReachable() : false;

    response.json({
      status: 'ok',
      app: 'LAST CHANCE',
      server: 'up',
      supabase: {
        configured: env.supabaseConfigured,
        reachable
      }
    });
  } catch (error: unknown) {
    next(error);
  }
});
