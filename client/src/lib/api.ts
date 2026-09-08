import type { SyllabusData, TopicStatus, TopicStatusResult } from '../types/syllabus';

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
  constructor(message: string, public readonly status?: number) { super(message); this.name = 'ApiError'; }
}

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) throw new ApiError('The request could not be completed.', response.status);
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
