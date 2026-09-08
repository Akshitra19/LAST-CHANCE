import { app } from '../app.js';

const expectedCsCodes = new Set(['CS-S1-ENGINEERING-MATHEMATICS', 'CS-S2-DIGITAL-LOGIC', 'CS-S3-COMPUTER-ORGANIZATION-ARCHITECTURE', 'CS-S4-PROGRAMMING-DATA-STRUCTURES', 'CS-S5-ALGORITHMS', 'CS-S6-THEORY-COMPUTATION', 'CS-S7-COMPILER-DESIGN', 'CS-S8-OPERATING-SYSTEM', 'CS-S9-DATABASES', 'CS-S10-COMPUTER-NETWORKS']);

type Settings = { examName: string; examDate: string | null; targetMarks: number; weekdayStudyHours: number; sundayStudyHours: number; mondayStudyHours: number; updatedAt: string };
type Topic = { id: string; code: string; name: string; status: string; children: Topic[] };
type Syllabus = { version: string; subjectCount: number; topicCount: number; subjects: Array<{ code: string; paperCode: string; topics: Topic[] }> };

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main(): Promise<void> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert(address && typeof address !== 'string', 'API server failed to bind.');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const request = async (path: string, options?: RequestInit) => {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { 'content-type': 'application/json', ...(options?.headers ?? {}) } });
    const payload: unknown = await response.json();
    return { response, payload };
  };
  let originalSettings: Settings | undefined;
  let originalTopic: { id: string; status: string } | undefined;
  let mutationStarted = false;
  try {
    const settingsResult = await request('/api/settings');
    assert(settingsResult.response.status === 200, 'GET /api/settings failed.');
    originalSettings = (settingsResult.payload as { data: Settings }).data;
    const temporaryTargetMarks = originalSettings.targetMarks === 71 ? 70 : 71;
    mutationStarted = true;
    const settingsPatch = await request('/api/settings', { method: 'PATCH', body: JSON.stringify({ targetMarks: temporaryTargetMarks }) });
    assert(settingsPatch.response.status === 200 && (settingsPatch.payload as { data: Settings }).data.targetMarks === temporaryTargetMarks, 'PATCH /api/settings did not persist the temporary value.');
    const settingsRead = await request('/api/settings');
    assert((settingsRead.payload as { data: Settings }).data.targetMarks === temporaryTargetMarks, 'GET /api/settings did not return the temporary value.');

    const syllabusResult = await request('/api/syllabus');
    assert(syllabusResult.response.status === 200, 'GET /api/syllabus failed.');
    const syllabus = (syllabusResult.payload as { data: Syllabus }).data;
    assert(syllabus.version === 'GATE_2027' && syllabus.subjectCount === 11 && syllabus.topicCount === 173, 'Syllabus counts or version are incorrect.');
    assert(syllabus.subjects.some((subject) => subject.code === 'GA' && subject.paperCode === 'GA'), 'GA is missing.');
    const csCodes = new Set(syllabus.subjects.filter((subject) => subject.paperCode === 'CS').map((subject) => subject.code));
    assert(csCodes.size === 10 && [...expectedCsCodes].every((code) => csCodes.has(code)), 'CS sections are incomplete.');
    const findTopic = (topics: Topic[]): Topic | undefined => { for (const topic of topics) { if (topic.children.length === 0) return topic; const child = findTopic(topic.children); if (child) return child; } return undefined; };
    const selectedTopic = syllabus.subjects.map((subject) => findTopic(subject.topics)).find((topic): topic is Topic => Boolean(topic));
    assert(selectedTopic, 'No official topic is available for status verification.');
    originalTopic = { id: selectedTopic.id, status: selectedTopic.status };
    const temporaryStatus = originalTopic.status === 'LEARNING' ? 'NOT_STARTED' : 'LEARNING';
    const topicPatch = await request(`/api/topics/${originalTopic.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: temporaryStatus }) });
    assert(topicPatch.response.status === 200 && (topicPatch.payload as { data: { status: string } }).data.status === temporaryStatus, 'PATCH topic status did not persist the temporary value.');

    const invalidChecks = await Promise.all([
      request('/api/settings', { method: 'PATCH', body: JSON.stringify({ ignored: true }) }),
      request('/api/settings', { method: 'PATCH', body: JSON.stringify({}) }),
      request('/api/settings', { method: 'PATCH', body: JSON.stringify({ targetMarks: 101 }) }),
      request('/api/settings', { method: 'PATCH', body: JSON.stringify({ weekdayStudyHours: -1 }) }),
      request('/api/topics/not-a-uuid/status', { method: 'PATCH', body: JSON.stringify({ status: 'LEARNING' }) }),
      request('/api/topics/00000000-0000-0000-0000-000000000000/status', { method: 'PATCH', body: JSON.stringify({ status: 'LEARNING' }) }),
      request(`/api/topics/${originalTopic.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'INVALID' }) }),
      request(`/api/topics/${originalTopic.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'LEARNING', extra: true }) })
    ]);
    const expectedStatuses = [400, 400, 400, 400, 400, 404, 400, 400];
    invalidChecks.forEach((result, index) => { assert(result.response.status === expectedStatuses[index], `Invalid-request check ${index + 1} returned ${result.response.status}.`); assert(typeof result.payload === 'object' && result.payload !== null && 'error' in result.payload, `Invalid-request check ${index + 1} did not use the error envelope.`); });
  } finally {
    let restoreError: Error | undefined;
    try {
      if (originalSettings && mutationStarted) {
        const restore = await request('/api/settings', { method: 'PATCH', body: JSON.stringify({ targetMarks: originalSettings.targetMarks }) });
        if (restore.response.status !== 200) throw new Error('Settings restoration failed.');
      }
      if (originalTopic) {
        const restore = await request(`/api/topics/${originalTopic.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: originalTopic.status }) });
        if (restore.response.status !== 200) throw new Error('Topic-status restoration failed.');
      }
      if (originalSettings) {
        const finalSettings = await request('/api/settings');
        if ((finalSettings.payload as { data: Settings }).data.targetMarks !== originalSettings.targetMarks) throw new Error('Final settings state was not restored.');
      }
      if (originalTopic) {
        const finalSyllabus = (await request('/api/syllabus')).payload as { data: Syllabus };
        const collect = (topics: Topic[]): Topic[] => topics.flatMap((topic) => [topic, ...collect(topic.children)]);
        const finalTopic = finalSyllabus.data.subjects.flatMap((subject) => collect(subject.topics)).find((topic) => topic.id === originalTopic!.id);
        if (!finalTopic || finalTopic.status !== originalTopic.status) throw new Error('Final topic status was not restored.');
      }
    } catch (error) { restoreError = error instanceof Error ? error : new Error('Restoration failed.'); }
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (restoreError) throw restoreError;
  }
  console.log(JSON.stringify({ status: 'PASS', settingsRestored: true, topicStatusRestored: true, invalidRequests: 8 }, null, 2));
}

main().catch((error: unknown) => { console.error(`API verification failed: ${error instanceof Error ? error.message : 'Unknown error.'}`); process.exitCode = 1; });
