import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getTest, startAttempt } from '../lib/api';
import type { TestDetail } from '../types/test';

export function TestStartPage(){
  const{testId}=useParams();const navigate=useNavigate();const[test,setTest]=useState<TestDetail|null>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading'),[starting,setStarting]=useState(false),[error,setError]=useState('');
  const load=useCallback(async(signal?:AbortSignal)=>{if(!testId){setState('error');return}setState('loading');try{setTest(await getTest(testId,signal));setState('ready')}catch{if(!signal?.aborted)setState('error')}},[testId]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
  const begin=async()=>{if(!testId)return;if(test?.activeAttemptId){navigate(`/attempts/${test.activeAttemptId}`);return}setStarting(true);setError('');try{const attempt=await startAttempt(testId);navigate(`/attempts/${attempt.id}`)}catch{setError('Couldn’t start this test. Please try again.');setStarting(false)}};
  if(state==='loading')return <section className="test-start"><p className="panel-state" role="status">Loading test…</p></section>;
  if(state==='error'||!test)return <section className="test-start"><div className="panel-state" role="alert"><h1>Couldn’t load this test</h1><p>Check the local server connection and try again.</p><button className="retry-button" onClick={()=>void load()} type="button">Retry</button><Link to="/test">Back to Tests</Link></div></section>;
  const action=test.activeAttemptId?'Continue Test':test.attemptCount>0?'Retake Test':'Start Test';
  return <section className="test-start" aria-labelledby="test-start-title"><Link className="back-link" to="/test">← Back to Tests</Link><article className="test-start__card"><p className="eyebrow">TEST ENGINE</p><h1 id="test-start-title">{test.name}</h1><dl><div><dt>Questions</dt><dd>{test.questionCount}</dd></div><div><dt>Marks</dt><dd>{test.totalMarks}</dd></div><div><dt>Duration</dt><dd>{test.durationMinutes} minutes</dd></div></dl><div className="test-start__notice" role="note"><strong>The timer never pauses.</strong><p>It continues if you refresh, close this page, or exit to Tests. Saved answers remain available when you continue.</p></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary-button test-start__button" disabled={starting} onClick={()=>void begin()} type="button">{starting?'Opening…':action}</button>{test.activeAttemptId&&<p className="test-start__resume">Your in-progress attempt and original deadline will be restored.</p>}</article></section>;
}
