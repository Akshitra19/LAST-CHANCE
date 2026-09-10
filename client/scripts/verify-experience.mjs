import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root=process.cwd(),read=(path)=>readFile(join(root,path),'utf8');
const [experience,vite,syllabus,start,provider,css,packageJson]=await Promise.all([
  read('client/src/lib/experience.ts'),read('client/vite.config.ts'),read('client/src/pages/SyllabusPage.tsx'),read('client/src/pages/TestStartPage.tsx'),read('client/src/components/experience/ExperienceProvider.tsx'),read('client/src/styles/global.css'),read('client/package.json')
]);
for(const contract of ["pathname === '/'","test|tests|questions|results|mistakes","pathname.startsWith('/syllabus')","pathname.startsWith('/plan')","return 'More'","Asia/Kolkata","signature: 1.05"])assert.ok(experience.includes(contract),`Missing experience contract: ${contract}`);
assert.match(vite,/registerType:\s*'prompt'/);assert.doesNotMatch(vite,/registerType:\s*'autoUpdate'/);
for(const icon of ['icon-192.png','icon-512.png','maskable-icon-512.png'])assert.ok(vite.includes(icon));
assert.doesNotMatch(syllabus,/data\.subjects\[0\]/);assert.match(syllabus,/aria-expanded/);assert.match(syllabus,/aria-controls/);assert.match(syllabus,/AnimatePresence/);
for(const contract of [/visibilitychange/,/requestSent\.current/,/activeAttemptId/,/useReducedMotion/,/nextCountdownFrame/])assert.match(start,contract);
for(const contract of [/sessionStorage/,/pathname\.startsWith\('\/attempts\/'\)/,/dirtyCount/,/registerSW/,/experienceHarness/,/reduced-motion/,/text-zoom-200/,/experienceHarness === 'offline'/,/experienceHarness === 'update'/,/reducedMotion=\{forceReducedMotion/])assert.match(provider,contract);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/v1-12-reduced-motion-test/);
assert.match(css,/v1-12-text-zoom-test\{font-size:200%\}/);
assert.equal(JSON.parse(packageJson).dependencies.motion,'13.2.0');
console.log('V1.12 experience verifier: PASS');
