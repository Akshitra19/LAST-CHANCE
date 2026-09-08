import { randomUUID } from 'node:crypto';
import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import { getQuestionRowForImage, setQuestionImagePath } from './questions.service.js';

export const questionImageBucket = 'question-images';
export const questionImageMaxBytes = 5 * 1024 * 1024;
export const questionImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
type ImageMime = typeof questionImageMimeTypes[number];

function storage() { const client = getSupabaseClient(); if (!client) throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Image storage is unavailable.'); return client.storage; }
function storageFailed(): never { throw new AppError(503, 'STORAGE_UNAVAILABLE', 'Image storage is unavailable.'); }
function extension(mime: ImageMime): string { return mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp'; }
function mimeForPath(path: string): ImageMime { if (path.endsWith('.jpg')) return 'image/jpeg'; if (path.endsWith('.png')) return 'image/png'; return 'image/webp'; }

export async function ensureQuestionImageBucket(): Promise<{ name: string; private: true; fileSizeLimit: number; allowedMimeTypes: readonly string[] }> {
  const { data: buckets, error: listError } = await storage().listBuckets(); if (listError) storageFailed();
  const existing = buckets.find((bucket) => bucket.id === questionImageBucket || bucket.name === questionImageBucket);
  const options = { public: false, fileSizeLimit: questionImageMaxBytes, allowedMimeTypes: [...questionImageMimeTypes] };
  if (!existing) { const { error } = await storage().createBucket(questionImageBucket, options); if (error) storageFailed(); }
  else { const raw = existing as typeof existing & { file_size_limit?: number | null; allowed_mime_types?: string[] | null }; const allowed = raw.allowed_mime_types ?? []; const correct = existing.public === false && raw.file_size_limit === questionImageMaxBytes && questionImageMimeTypes.every((mime) => allowed.includes(mime)) && allowed.length === questionImageMimeTypes.length; if (!correct) { const { error } = await storage().updateBucket(questionImageBucket, options); if (error) storageFailed(); } }
  const { data, error } = await storage().getBucket(questionImageBucket); if (error || !data) storageFailed();
  const verified = data as typeof data & { file_size_limit?: number | null; allowed_mime_types?: string[] | null }; const allowed = verified.allowed_mime_types ?? [];
  if (data.public || verified.file_size_limit !== questionImageMaxBytes || allowed.length !== questionImageMimeTypes.length || !questionImageMimeTypes.every((mime) => allowed.includes(mime))) throw new AppError(503, 'STORAGE_CONFIGURATION_INVALID', 'Image storage configuration is invalid.');
  return { name: questionImageBucket, private: true, fileSizeLimit: questionImageMaxBytes, allowedMimeTypes: questionImageMimeTypes };
}

export function validateQuestionImage(body: Buffer, contentType: string | undefined): ImageMime {
  const mime = contentType?.split(';', 1)[0]?.trim().toLowerCase();
  if (!questionImageMimeTypes.includes(mime as ImageMime)) throw new AppError(415, 'UNSUPPORTED_IMAGE_TYPE', 'Use a JPEG, PNG, or WebP image.');
  if (body.length === 0) throw new AppError(400, 'EMPTY_IMAGE', 'Image cannot be empty.');
  if (body.length > questionImageMaxBytes) throw new AppError(413, 'IMAGE_TOO_LARGE', 'Image must be 5 MB or smaller.');
  const signatureMatches = mime === 'image/jpeg' ? body.length >= 3 && body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff
    : mime === 'image/png' ? body.length >= 8 && body.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))
      : body.length >= 12 && body.subarray(0, 4).toString('ascii') === 'RIFF' && body.subarray(8, 12).toString('ascii') === 'WEBP';
  if (!signatureMatches) throw new AppError(415, 'IMAGE_SIGNATURE_MISMATCH', 'Image content does not match its type.');
  return mime as ImageMime;
}

async function uploadObject(path: string, body: Buffer, mime: ImageMime): Promise<void> { const { error } = await storage().from(questionImageBucket).upload(path, body, { contentType: mime, upsert: false }); if (error) storageFailed(); }
export async function removeQuestionImageObject(path: string): Promise<void> { const { error } = await storage().from(questionImageBucket).remove([path]); if (error) storageFailed(); }

export async function replaceQuestionImage(questionId: string, body: Buffer, contentType: string | undefined) {
  const question = await getQuestionRowForImage(questionId); const mime = validateQuestionImage(body, contentType); const newPath = `questions/${questionId}/${randomUUID()}.${extension(mime)}`;
  await uploadObject(newPath, body, mime);
  try { await setQuestionImagePath(questionId, newPath); }
  catch (error) { try { await removeQuestionImageObject(newPath); } catch { console.error('New question image cleanup failed.'); } throw error; }
  if (question.image_path) { try { await removeQuestionImageObject(question.image_path); } catch { console.error('Replaced question image cleanup failed.'); } }
  return { hasImage: true, imageUrl: `/api/questions/${questionId}/image` };
}
export async function downloadQuestionImage(questionId: string): Promise<{ body: Buffer; contentType: ImageMime }> { const question = await getQuestionRowForImage(questionId); if (!question.image_path) throw new AppError(404, 'QUESTION_IMAGE_NOT_FOUND', 'Question image was not found.'); const { data, error } = await storage().from(questionImageBucket).download(question.image_path); if (error || !data) throw new AppError(404, 'QUESTION_IMAGE_NOT_FOUND', 'Question image was not found.'); return { body: Buffer.from(await data.arrayBuffer()), contentType: mimeForPath(question.image_path) }; }
export async function removeQuestionImage(questionId: string): Promise<void> { const question = await getQuestionRowForImage(questionId); if (!question.image_path) return; await setQuestionImagePath(questionId, null); try { await removeQuestionImageObject(question.image_path); } catch { console.error('Removed question image object cleanup failed.'); } }
export async function listQuestionImageObjects(questionId: string): Promise<string[]> { const prefix = `questions/${questionId}`; const { data, error } = await storage().from(questionImageBucket).list(prefix, { limit: 100 }); if (error) storageFailed(); return data.map((item) => `${prefix}/${item.name}`); }
