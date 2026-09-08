import { app } from '../app.js';
import { deleteQuestionRowForCleanup, findQuestionRow } from '../repositories/questions.repository.js';
import { ensureQuestionImageBucket, listQuestionImageObjects, removeQuestionImage, removeQuestionImageObject } from '../services/question-storage.js';

type Detail = { id:string; questionType:string; questionText:string; marks:number; difficulty:string|null; year:number|null; correctAnswer:{optionKeys?:string[];min?:number;max?:number}; options:Array<{key:string;text:string}>; hasImage:boolean; archived:boolean; archivedAt:string|null; subject:{id:string}; topic:{id:string} };
type ListItem = { id:string; questionType:string; marks:number; difficulty:string|null; year:number|null; archived:boolean; subject:{id:string}; topic:{id:string} };
type ListData = { items:ListItem[]; page:number;pageSize:number;total:number;totalPages:number };
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const json = (body: unknown): RequestInit => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

async function main(): Promise<void> {
  const bucket = await ensureQuestionImageBucket(); assert(bucket.private && bucket.fileSizeLimit === 5 * 1024 * 1024, 'Private bucket configuration failed.');
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>((resolve) => server.once('listening', resolve)); const address = server.address(); assert(address && typeof address !== 'string', 'Verifier server failed to bind.'); const base = `http://127.0.0.1:${address.port}`;
  const request = async (path:string, options:RequestInit={}) => { const response = await fetch(`${base}${path}`, options); const body:unknown = response.status === 204 ? null : response.headers.get('content-type')?.includes('application/json') ? await response.json() : Buffer.from(await response.arrayBuffer()); return { response, body }; };
  const data = <T>(result:{body:unknown}) => (result.body as {data:T}).data;
  const createdIds:string[] = [];
  try {
    const syllabus = data<{subjects:Array<{id:string;topics:Array<{id:string}>}>}>(await request('/api/syllabus')); const first = syllabus.subjects[0]!; const second = syllabus.subjects[1]!; const topic = first.topics[0]!;
    const baseline = await request('/api/questions'); const baselineList = data<ListData>(baseline); assert(baseline.response.status === 200 && baselineList.page === 1 && baselineList.pageSize === 20 && Number.isInteger(baselineList.totalPages), 'Baseline pagination failed.');
    const invalidLists = await Promise.all(['/api/questions?questionType=BAD','/api/questions?marks=3','/api/questions?difficulty=BAD','/api/questions?year=1979','/api/questions?page=0','/api/questions?pageSize=101','/api/questions?subjectId=bad','/api/questions?unknown=x'].map((path) => request(path)));
    assert(invalidLists.every((result) => result.response.status === 400), 'Invalid list filters were accepted.');
    const baseQuestion = { subjectId:first.id, topicId:topic.id, questionText:'Temporary V1.6 verifier question', questionType:'MCQ', marks:1, difficulty:'MEDIUM', year:2025, source:'V1.6 verifier', explanation:'Temporary verification explanation', options:[{key:'A',text:'Alpha'},{key:'B',text:'Beta'},{key:'C',text:'Gamma'},{key:'D',text:'Delta'}], correctAnswer:{optionKeys:['B']} };
    const invalidBodies = [
      {...baseQuestion,questionType:'BAD'}, {...baseQuestion,marks:3}, {...baseQuestion,difficulty:'BAD'}, {...baseQuestion,year:2101}, {...baseQuestion,questionText:'   '}, {...baseQuestion,extra:true},
      {...baseQuestion,subjectId:second.id}, {...baseQuestion,subjectId:'00000000-0000-0000-0000-000000000000'}, {...baseQuestion,topicId:'00000000-0000-0000-0000-000000000000'},
      {...baseQuestion,correctAnswer:{optionKeys:[]}}, {...baseQuestion,correctAnswer:{optionKeys:['A','B']}}, {...baseQuestion,correctAnswer:{optionKeys:['F']}},
      {...baseQuestion,options:[{key:'A',text:'A'},{key:'C',text:'C'}],correctAnswer:{optionKeys:['A']}}, {...baseQuestion,options:[{key:'A',text:'A'},{key:'B',text:''}],correctAnswer:{optionKeys:['A']}},
      {...baseQuestion,questionType:'MSQ',correctAnswer:{optionKeys:[]}}, {...baseQuestion,questionType:'MSQ',correctAnswer:{optionKeys:['A','A']}}, {...baseQuestion,questionType:'MSQ',correctAnswer:{optionKeys:['F']}},
      {...baseQuestion,questionType:'NAT',options:[],correctAnswer:{min:2,max:1}}, {...baseQuestion,questionType:'NAT',options:baseQuestion.options,correctAnswer:{min:1,max:1}}, {...baseQuestion,questionType:'NAT',options:[],correctAnswer:{optionKeys:['A']}},
      {...baseQuestion,questionType:'NAT',options:[],correctAnswer:{min:null,max:1}}
    ];
    const invalidCreates = await Promise.all(invalidBodies.map((body) => request('/api/questions',{method:'POST',...json(body)}))); assert(invalidCreates.every((result) => result.response.status === 400 || result.response.status === 404), 'Invalid question body was accepted.');

    let mcq = data<Detail>(await request('/api/questions',{method:'POST',...json(baseQuestion)})); createdIds.push(mcq.id); assert(mcq.options.length === 4 && mcq.correctAnswer.optionKeys?.join(',') === 'B', 'MCQ canonical create failed.');
    assert(data<Detail>(await request(`/api/questions/${mcq.id}`)).options.map((option) => option.key).join(',') === 'A,B,C,D', 'MCQ detail ordering failed.');
    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({questionText:'Edited temporary verifier question',options:[{key:'A',text:'Alpha edited'},{key:'B',text:'Beta'},{key:'C',text:'Gamma'},{key:'D',text:'Delta'}],correctAnswer:{optionKeys:['A']}})})); assert(mcq.questionText.startsWith('Edited') && mcq.options[0]?.text === 'Alpha edited' && mcq.correctAnswer.optionKeys?.[0] === 'A', 'MCQ edit persistence failed.');
    assert((await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({})})).response.status === 400, 'Empty PATCH accepted.');
    assert((await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({createdAt:'x'})})).response.status === 400, 'Unknown PATCH field accepted.');

    const msqInput = {...baseQuestion,questionText:'Temporary MSQ',questionType:'MSQ',marks:2,difficulty:'HARD',year:2024,correctAnswer:{optionKeys:['C','A']}};
    const msq = data<Detail>(await request('/api/questions',{method:'POST',...json(msqInput)})); createdIds.push(msq.id); assert(msq.correctAnswer.optionKeys?.join(',') === 'A,C', 'MSQ answer was not canonicalized by display order.');
    const natExact = data<Detail>(await request('/api/questions',{method:'POST',...json({...baseQuestion,questionText:'Temporary NAT exact',questionType:'NAT',options:[],correctAnswer:{min:12.5,max:12.5}})})); createdIds.push(natExact.id); assert(natExact.options.length === 0 && natExact.correctAnswer.min === natExact.correctAnswer.max, 'NAT exact failed.');
    const natRange = data<Detail>(await request('/api/questions',{method:'POST',...json({...baseQuestion,questionText:'Temporary NAT range',questionType:'NAT',options:[],correctAnswer:{min:-2.75,max:3.5}})})); createdIds.push(natRange.id); assert(natRange.options.length === 0 && natRange.correctAnswer.min === -2.75 && natRange.correctAnswer.max === 3.5, 'NAT range failed.');

    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({questionType:'MSQ',correctAnswer:{optionKeys:['D','A']}})})); assert(mcq.questionType === 'MSQ' && mcq.options.length === 4 && mcq.correctAnswer.optionKeys?.join(',') === 'A,D', 'MCQ to MSQ failed.');
    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({questionType:'NAT',correctAnswer:{min:-1.5,max:2.25}})})); assert(mcq.questionType === 'NAT' && mcq.options.length === 0 && mcq.correctAnswer.min === -1.5, 'MSQ to NAT left stale data.');
    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({questionType:'MCQ',options:[{key:'A',text:'New A'},{key:'B',text:'New B'}],correctAnswer:{optionKeys:['B']}})})); assert(mcq.questionType === 'MCQ' && mcq.options.length === 2 && mcq.correctAnswer.optionKeys?.join(',') === 'B', 'NAT to MCQ failed.');

    const filterCases:Array<{query:string; expectedId:string; matches:(item:ListItem)=>boolean}> = [
      {query:`subjectId=${first.id}`,expectedId:mcq.id,matches:(item)=>item.subject.id===first.id},
      {query:`topicId=${topic.id}`,expectedId:mcq.id,matches:(item)=>item.topic.id===topic.id},
      {query:'questionType=MSQ',expectedId:msq.id,matches:(item)=>item.questionType==='MSQ'},
      {query:'marks=2',expectedId:msq.id,matches:(item)=>item.marks===2},
      {query:'difficulty=HARD',expectedId:msq.id,matches:(item)=>item.difficulty==='HARD'},
      {query:'year=2024',expectedId:msq.id,matches:(item)=>item.year===2024},
      {query:'archived=false',expectedId:mcq.id,matches:(item)=>!item.archived},
      {query:'page=1&pageSize=1',expectedId:'',matches:()=>true}
    ];
    for (const testCase of filterCases) { const filtered = data<ListData>(await request(`/api/questions?${testCase.query}`)); const expectedPageSize = testCase.query.includes('pageSize=1') ? 1 : 20; assert(filtered.pageSize === expectedPageSize && filtered.items.every((item) => !item.archived && testCase.matches(item)) && (!testCase.expectedId || filtered.items.some((item)=>item.id===testCase.expectedId)), `Filter failed: ${testCase.query}`); }
    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({archived:true})})); assert(mcq.archived && mcq.archivedAt, 'Archive semantics failed.');
    assert(!data<ListData>(await request('/api/questions')).items.some((item) => item.id === mcq.id), 'Archived question remained active.'); assert(data<ListData>(await request('/api/questions?archived=true&pageSize=100')).items.some((item) => item.id === mcq.id), 'Archived filter failed.');
    mcq = data<Detail>(await request(`/api/questions/${mcq.id}`,{method:'PATCH',...json({archived:false})})); assert(!mcq.archived && mcq.archivedAt === null, 'Restore semantics failed.');
    assert((await request(`/api/questions/${mcq.id}`,{method:'DELETE'})).response.status === 404, 'Public hard delete route exists.');

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Z9sAAAAASUVORK5CYII=','base64');
    const upload = await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/png'},body:png}); assert(upload.response.status === 200 && data<{hasImage:boolean}>(upload).hasImage, 'PNG upload failed.');
    const downloaded = await request(`/api/questions/${mcq.id}/image`); assert(downloaded.response.status === 200 && downloaded.response.headers.get('content-type')?.startsWith('image/png') && Buffer.isBuffer(downloaded.body), 'Private image retrieval failed.');
    const webp = Buffer.concat([Buffer.from('RIFF'),Buffer.from([4,0,0,0]),Buffer.from('WEBP')]); const replacement = await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/webp'},body:webp}); assert(replacement.response.status === 200, 'Image replacement failed.');
    assert((await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/svg+xml'},body:Buffer.from('<svg/>')})).response.status === 415, 'Unsupported image accepted.');
    assert((await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.from('fake')})).response.status === 415, 'Fake image signature accepted.');
    assert((await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.alloc(0)})).response.status === 400, 'Empty image accepted.');
    assert((await request(`/api/questions/${mcq.id}/image`,{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.alloc(5 * 1024 * 1024 + 1,1)})).response.status === 413, 'Oversized image accepted.');
    assert((await request(`/api/questions/${mcq.id}/image`,{method:'DELETE'})).response.status === 204, 'Image removal failed.'); assert((await request(`/api/questions/${mcq.id}/image`)).response.status === 404, 'Removed image still available.'); assert(!(await getQuestionAfter(request,mcq.id)).hasImage, 'Image flag not cleared.');
  } finally {
    let cleanupFailed = false;
    for (const id of createdIds) { try { await removeQuestionImage(id); for (const path of await listQuestionImageObjects(id)) await removeQuestionImageObject(path); await deleteQuestionRowForCleanup(id); if (await findQuestionRow(id) || (await listQuestionImageObjects(id)).length) cleanupFailed = true; } catch { cleanupFailed = true; } }
    await new Promise<void>((resolve,reject) => server.close((error) => error ? reject(error) : resolve())); if (cleanupFailed) throw new Error('Question verifier cleanup failed.');
  }
  console.log(JSON.stringify({status:'PASS',invalidListCases:8,invalidBodyCases:21,questionTypes:['MCQ','MSQ','NAT'],typeTransitions:3,filterCases:8,imageCases:8,temporaryQuestionsRemoved:true,temporaryOptionsRemoved:true,temporaryStorageObjectsRemoved:true,permanentMutations:0},null,2));
}
async function getQuestionAfter(request:(path:string,options?:RequestInit)=>Promise<{body:unknown}>,id:string):Promise<Detail>{return ((await request(`/api/questions/${id}`)).body as {data:Detail}).data;}
main().catch((error:unknown)=>{console.error(`Question verification failed: ${error instanceof Error ? error.message : 'Unknown error.'}`);process.exitCode=1;});
