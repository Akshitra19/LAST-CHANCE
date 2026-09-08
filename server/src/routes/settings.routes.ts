import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { getSettings, patchSettings } from '../services/settings.service.js';
import { settingsPatchSchema } from '../validation/settings.schemas.js';

export const settingsRouter = Router();
settingsRouter.get('/', async (_request, response, next) => { try { response.json({ data: await getSettings() }); } catch (error) { next(error); } });
settingsRouter.patch('/', async (request, response, next) => { try { const parsed = settingsPatchSchema.safeParse(request.body); if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Settings update is invalid.'); response.json({ data: await patchSettings(parsed.data) }); } catch (error) { next(error); } });
