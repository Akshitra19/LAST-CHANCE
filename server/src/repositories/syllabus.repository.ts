import { AppError } from '../errors/app-error.js';
import { getSupabaseClient } from '../config/supabase.js';
import type { Tables, TablesUpdate } from '../types/database.types.js';

export type SubjectRow = Pick<Tables<'subjects'>, 'id' | 'code' | 'source_paper_code' | 'name' | 'display_order' | 'is_official' | 'syllabus_version'>;
export type TopicRow = Pick<Tables<'topics'>, 'id' | 'subject_id' | 'parent_topic_id' | 'code' | 'name' | 'preparation_status' | 'display_order' | 'is_official' | 'syllabus_version' | 'updated_at'>;

function clientOrThrow() {
  const client = getSupabaseClient();
  if (!client) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return client;
}

export async function fetchOfficialSubjects(): Promise<SubjectRow[]> {
  const { data, error } = await clientOrThrow().from('subjects').select('id,code,source_paper_code,name,display_order,is_official,syllabus_version').eq('syllabus_version', 'GATE_2027').order('source_paper_code').order('display_order').order('code');
  if (error) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return data;
}

export async function fetchOfficialTopics(): Promise<TopicRow[]> {
  const { data, error } = await clientOrThrow().from('topics').select('id,subject_id,parent_topic_id,code,name,preparation_status,display_order,is_official,syllabus_version,updated_at').eq('syllabus_version', 'GATE_2027').order('subject_id').order('display_order').order('code');
  if (error) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return data;
}

export async function updateTopicStatus(id: string, update: TablesUpdate<'topics'>): Promise<TopicRow | null> {
  const { data, error } = await clientOrThrow().from('topics').update(update).eq('id', id).select('id,subject_id,parent_topic_id,code,name,preparation_status,display_order,is_official,syllabus_version,updated_at').maybeSingle();
  if (error) throw new AppError(503, 'DATABASE_UNAVAILABLE', 'Database service is unavailable.');
  return data;
}
