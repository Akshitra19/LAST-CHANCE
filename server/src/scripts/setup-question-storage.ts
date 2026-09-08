import { ensureQuestionImageBucket } from '../services/question-storage.js';

ensureQuestionImageBucket()
  .then((result) => console.log(JSON.stringify({ status: 'PASS', bucket: result.name, private: result.private, fileSizeLimit: result.fileSizeLimit, allowedMimeTypes: result.allowedMimeTypes }, null, 2)))
  .catch((error: unknown) => { console.error(`Question storage setup failed: ${error instanceof Error ? error.message : 'Unknown error.'}`); process.exitCode = 1; });
