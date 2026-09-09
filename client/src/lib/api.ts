import type { SyllabusData, TopicStatus, TopicStatusResult } from '../types/syllabus';
import type { SettingsData, SettingsPatch } from '../types/settings';
import type { CreateDailyTaskInput, DailyTask, DailyTaskStatus, UpdateDailyTaskInput } from '../types/daily-task';
import type { CreateQuestionInput, QuestionDetail, QuestionFilters, QuestionList, UpdateQuestionInput } from '../types/question';
import type { CreateTestInput, TestDetail, TestFilters, TestList, UpdateTestInput } from '../types/test';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export interface HealthResponse {
  status: 'ok';
  app: 'LAST CHANCE';
  server: 'up';
  supabase: {
    configured: boolean;
    reachable: boolean;
  };
}

export async function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${apiBaseUrl}/api/health`, { signal });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}.`);
  }

  return (await response.json()) as HealthResponse;
}

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number, public readonly code?: string) { super(message); this.name = 'ApiError'; }
}

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) { let payload:unknown;try{payload=await response.json()}catch{payload=null}const error=payload&&typeof payload==='object'&&'error'in payload?(payload as{error?:{message?:unknown;code?:unknown}}).error:undefined;throw new ApiError(typeof error?.message==='string'?error.message:'The request could not be completed.',response.status,typeof error?.code==='string'?error.code:undefined); }
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object' || !('data' in payload)) throw new ApiError('The server returned an invalid response.');
  return (payload as { data: T }).data;
}

export async function getSyllabus(signal?: AbortSignal): Promise<SyllabusData> {
  const data = await readData<SyllabusData>(await fetch(`${apiBaseUrl}/api/syllabus`, { signal }));
  if (data.version !== 'GATE_2027' || !Array.isArray(data.subjects) || data.subjectCount !== data.subjects.length || data.topicCount < 1) throw new ApiError('The syllabus response is invalid.');
  return data;
}

export async function updateTopicStatus(topicId: string, status: TopicStatus): Promise<TopicStatusResult> {
  return readData<TopicStatusResult>(await fetch(`${apiBaseUrl}/api/topics/${encodeURIComponent(topicId)}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) }));
}

export async function getSettings(signal?: AbortSignal): Promise<SettingsData> {
  const data = await readData<SettingsData>(await fetch(`${apiBaseUrl}/api/settings`, { signal }));
  if (!data || typeof data.examName !== 'string' || typeof data.targetMarks !== 'number') throw new ApiError('The settings response is invalid.');
  return data;
}

export async function updateSettings(changes: SettingsPatch): Promise<SettingsData> {
  return readData<SettingsData>(await fetch(`${apiBaseUrl}/api/settings`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(changes) }));
}

export async function getDailyTasks(date: string, signal?: AbortSignal): Promise<DailyTask[]> { return readData<DailyTask[]>(await fetch(`${apiBaseUrl}/api/daily-tasks?date=${encodeURIComponent(date)}`, { signal })); }
export async function createDailyTask(input: CreateDailyTaskInput): Promise<DailyTask> { return readData<DailyTask>(await fetch(`${apiBaseUrl}/api/daily-tasks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) })); }
export async function updateDailyTask(id: string, changes: UpdateDailyTaskInput): Promise<DailyTask> { return readData<DailyTask>(await fetch(`${apiBaseUrl}/api/daily-tasks/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(changes) })); }
export async function updateDailyTaskStatus(id: string, status: DailyTaskStatus): Promise<DailyTask> { return updateDailyTask(id, { status }); }
export async function deleteDailyTask(id: string): Promise<void> { const response = await fetch(`${apiBaseUrl}/api/daily-tasks/${encodeURIComponent(id)}`, { method: 'DELETE' }); if (!response.ok) throw new ApiError('The task could not be deleted.', response.status); }
export async function startDailyTaskTimer(id: string): Promise<DailyTask> { return readData<DailyTask>(await fetch(`${apiBaseUrl}/api/daily-tasks/${encodeURIComponent(id)}/timer/start`, { method: 'POST' })); }
export async function stopDailyTaskTimer(id: string): Promise<DailyTask> { return readData<DailyTask>(await fetch(`${apiBaseUrl}/api/daily-tasks/${encodeURIComponent(id)}/timer/stop`, { method: 'POST' })); }

export async function getQuestions(filters: QuestionFilters, signal?: AbortSignal): Promise<QuestionList> { const query = new URLSearchParams(); for (const [key,value] of Object.entries(filters)) if (value !== undefined && value !== '') query.set(key,String(value)); return readData<QuestionList>(await fetch(`${apiBaseUrl}/api/questions?${query}`,{signal})); }
export async function getQuestion(id:string,signal?:AbortSignal):Promise<QuestionDetail>{return readData<QuestionDetail>(await fetch(`${apiBaseUrl}/api/questions/${encodeURIComponent(id)}`,{signal}));}
export async function createQuestion(input:CreateQuestionInput):Promise<QuestionDetail>{return readData<QuestionDetail>(await fetch(`${apiBaseUrl}/api/questions`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}));}
export async function updateQuestion(id:string,input:UpdateQuestionInput):Promise<QuestionDetail>{return readData<QuestionDetail>(await fetch(`${apiBaseUrl}/api/questions/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(input)}));}
export async function uploadQuestionImage(id:string,file:File):Promise<{hasImage:true;imageUrl:string}>{return readData(await fetch(`${apiBaseUrl}/api/questions/${encodeURIComponent(id)}/image`,{method:'PUT',headers:{'content-type':file.type},body:file}));}
export async function removeQuestionImage(id:string):Promise<void>{const response=await fetch(`${apiBaseUrl}/api/questions/${encodeURIComponent(id)}/image`,{method:'DELETE'});if(!response.ok)throw new ApiError('The image could not be removed.',response.status);}
export function questionImageUrl(id:string,version?:string):string{return `${apiBaseUrl}/api/questions/${encodeURIComponent(id)}/image${version?`?v=${encodeURIComponent(version)}`:''}`;}

export async function getTests(filters:TestFilters,signal?:AbortSignal):Promise<TestList>{const query=new URLSearchParams();for(const[key,value]of Object.entries(filters))if(value!==undefined)query.set(key,String(value));return readData<TestList>(await fetch(`${apiBaseUrl}/api/tests?${query}`,{signal}))}
export async function getTest(id:string,signal?:AbortSignal):Promise<TestDetail>{return readData<TestDetail>(await fetch(`${apiBaseUrl}/api/tests/${encodeURIComponent(id)}`,{signal}))}
export async function createTest(input:CreateTestInput):Promise<TestDetail>{return readData<TestDetail>(await fetch(`${apiBaseUrl}/api/tests`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)}))}
export async function updateTest(id:string,input:UpdateTestInput):Promise<TestDetail>{return readData<TestDetail>(await fetch(`${apiBaseUrl}/api/tests/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify(input)}))}
export async function deleteTest(id:string):Promise<void>{const response=await fetch(`${apiBaseUrl}/api/tests/${encodeURIComponent(id)}`,{method:'DELETE'});if(!response.ok){let payload:unknown;try{payload=await response.json()}catch{payload=null}const error=payload&&typeof payload==='object'&&'error'in payload?(payload as{error?:{message?:unknown;code?:unknown}}).error:undefined;throw new ApiError(typeof error?.message==='string'?error.message:'The test could not be deleted.',response.status,typeof error?.code==='string'?error.code:undefined)}}
