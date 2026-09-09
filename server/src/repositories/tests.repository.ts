import { getSupabaseClient } from '../config/supabase.js';
import { AppError } from '../errors/app-error.js';
import type { Tables, TablesInsert, TablesUpdate } from '../types/database.types.js';
import type { ListTestsQuery } from '../validation/tests.schemas.js';

export type TestRow = Tables<'tests'>; export type TestQuestionRow = Tables<'test_questions'>;
export type SafeQuestionRow = Pick<Tables<'questions'>, 'id'|'subject_id'|'topic_id'|'question_text'|'question_type'|'marks'|'difficulty'|'image_path'|'archived'>;
export type TestSubject = Pick<Tables<'subjects'>, 'id'|'code'|'name'>; export type TestTopic = Pick<Tables<'topics'>, 'id'|'code'|'name'|'subject_id'>;
const testColumns = 'id,name,test_type,duration_minutes,total_marks,created_at,updated_at';
const safeQuestionColumns = 'id,subject_id,topic_id,question_text,question_type,marks,difficulty,image_path,archived';
function db(){const client=getSupabaseClient();if(!client)throw new AppError(503,'DATABASE_UNAVAILABLE','Database service is unavailable.');return client}
function failed():never{throw new AppError(503,'DATABASE_UNAVAILABLE','Database service is unavailable.')}

export async function listTestRows(query:ListTestsQuery){const from=(query.page-1)*query.pageSize;let request=db().from('tests').select(testColumns,{count:'exact'});if(query.testType)request=request.eq('test_type',query.testType);const{data,error,count}=await request.order('created_at',{ascending:false}).order('id',{ascending:false}).range(from,from+query.pageSize-1);if(error)failed();return{rows:data,total:count??0}}
export async function findTestRow(id:string):Promise<TestRow|null>{const{data,error}=await db().from('tests').select(testColumns).eq('id',id).maybeSingle();if(error)failed();return data}
export async function findTestQuestions(id:string):Promise<TestQuestionRow[]>{const{data,error}=await db().from('test_questions').select('test_id,question_id,position,created_at').eq('test_id',id).order('position');if(error)failed();return data}
export async function fetchTestStats(ids:string[]){if(!ids.length)return{questionCounts:new Map<string,number>(),attempted:new Set<string>()};const[links,attempts]=await Promise.all([db().from('test_questions').select('test_id').in('test_id',ids),db().from('attempts').select('test_id').in('test_id',ids)]);if(links.error||attempts.error)failed();const questionCounts=new Map<string,number>();for(const row of links.data)questionCounts.set(row.test_id,(questionCounts.get(row.test_id)??0)+1);return{questionCounts,attempted:new Set(attempts.data.map((row)=>row.test_id))}}
export async function findSafeQuestions(ids:string[]):Promise<SafeQuestionRow[]>{if(!ids.length)return[];const{data,error}=await db().from('questions').select(safeQuestionColumns).in('id',ids);if(error)failed();return data}
export async function fetchQuestionReferences(rows:SafeQuestionRow[]){const subjectIds=[...new Set(rows.map((row)=>row.subject_id))],topicIds=[...new Set(rows.map((row)=>row.topic_id))];const[subjects,topics]=await Promise.all([subjectIds.length?db().from('subjects').select('id,code,name').in('id',subjectIds):Promise.resolve({data:[] as TestSubject[],error:null}),topicIds.length?db().from('topics').select('id,code,name,subject_id').in('id',topicIds):Promise.resolve({data:[] as TestTopic[],error:null})]);if(subjects.error||topics.error)failed();return{subjects:subjects.data,topics:topics.data}}
export async function findTestTopic(id:string):Promise<TestTopic|null>{const{data,error}=await db().from('topics').select('id,code,name,subject_id').eq('id',id).maybeSingle();if(error)failed();return data}
export async function createTestRow(input:TablesInsert<'tests'>):Promise<TestRow>{const{data,error}=await db().from('tests').insert(input).select(testColumns).single();if(error)failed();return data}
export async function updateTestRow(id:string,input:TablesUpdate<'tests'>):Promise<TestRow|null>{const{data,error}=await db().from('tests').update(input).eq('id',id).select(testColumns).maybeSingle();if(error)failed();return data}
export async function insertTestQuestions(input:TablesInsert<'test_questions'>[]):Promise<TestQuestionRow[]>{const{data,error}=await db().from('test_questions').insert(input).select('test_id,question_id,position,created_at');if(error)failed();return data}
export async function deleteTestQuestions(id:string):Promise<void>{const{error}=await db().from('test_questions').delete().eq('test_id',id);if(error)failed()}
export async function deleteTestRow(id:string):Promise<void>{const{error}=await db().from('tests').delete().eq('id',id);if(error)failed()}
export async function testHasAttempts(id:string):Promise<boolean>{const{count,error}=await db().from('attempts').select('id',{count:'exact',head:true}).eq('test_id',id);if(error)failed();return(count??0)>0}
export async function questionHasAttempts(id:string):Promise<boolean>{const{data:links,error}=await db().from('test_questions').select('test_id').eq('question_id',id);if(error)failed();if(!links.length)return false;const{count,error:attemptError}=await db().from('attempts').select('id',{count:'exact',head:true}).in('test_id',links.map((row)=>row.test_id));if(attemptError)failed();return(count??0)>0}
export async function insertVerifierAttempt(testId:string):Promise<string>{const{data,error}=await db().from('attempts').insert({test_id:testId,status:'IN_PROGRESS'}).select('id').single();if(error)failed();return data.id}
export async function deleteVerifierAttempt(id:string):Promise<void>{const{error}=await db().from('attempts').delete().eq('id',id);if(error)failed()}
export async function findVerifierAttempt(id:string):Promise<boolean>{const{data,error}=await db().from('attempts').select('id').eq('id',id).maybeSingle();if(error)failed();return Boolean(data)}
