import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAttempt, questionImageUrl, saveAttemptAnswer, submitAttempt } from '../lib/api';
import type { AttemptQuestion, SubmittedAnswer, TestAttempt } from '../types/attempt';

type SaveState='Saving'|'Saved'|'Not saved'|undefined;
const answered=(question:AttemptQuestion)=>'optionKeys'in question.submittedAnswer?question.submittedAnswer.optionKeys.length>0:question.submittedAnswer.value!==null;
const optionKeys=(answer:SubmittedAnswer)=>'optionKeys'in answer?answer.optionKeys:[];
const natDraft=(question:AttemptQuestion)=>'value'in question.submittedAnswer&&question.submittedAnswer.value!==null?String(question.submittedAnswer.value):'';
const formatClock=(seconds:number)=>{const safe=Math.max(0,seconds),h=Math.floor(safe/3600),m=Math.floor((safe%3600)/60),s=safe%60;return[h,m,s].map((value)=>String(value).padStart(2,'0')).join(':')};

export function AttemptPage(){
  const{attemptId}=useParams();
  const navigate=useNavigate();
  const[attempt,setAttempt]=useState<TestAttempt|null>(null);
  const[loadState,setLoadState]=useState<'loading'|'ready'|'error'>('loading');
  const[currentIndex,setCurrentIndex]=useState(0);
  const[now,setNow]=useState(Date.now());
  const[saveStates,setSaveStates]=useState<Record<string,SaveState>>({});
  const[drafts,setDrafts]=useState<Record<string,string>>({});
  const[paletteOpen,setPaletteOpen]=useState(false);
  const[exitOpen,setExitOpen]=useState(false);
  const[submitOpen,setSubmitOpen]=useState(false);
  const[submitting,setSubmitting]=useState(false);
  const[notice,setNotice]=useState('');
  const latestRef=useRef<TestAttempt|null>(null);
  const currentIndexRef=useRef(0);
  const serverOffsetRef=useRef(0);
  const lastTickRef=useRef(Date.now());
  const versionsRef=useRef<Record<string,number>>({});
  const chainsRef=useRef<Record<string,Promise<void>>>({});
  const debouncesRef=useRef<Record<string,ReturnType<typeof setTimeout>>>({});
  const dirtyRef=useRef(new Set<string>());
  const lastSavedTimeRef=useRef<Record<string,number>>({});
  const lastRequestedTimeRef=useRef<Record<string,number>>({});
  const trackingPausedRef=useRef(false);
  const autoSubmitRef=useRef(false);
  const announcedRef=useRef(new Set<number>());

  const install=useCallback((value:TestAttempt)=>{
    latestRef.current=value;
    serverOffsetRef.current=Date.parse(value.serverNow)-Date.now();
    lastTickRef.current=Date.now();
    lastSavedTimeRef.current=Object.fromEntries(value.questions.map((question)=>[question.id,question.timeSeconds]));
    lastRequestedTimeRef.current={...lastSavedTimeRef.current};
    setDrafts(Object.fromEntries(value.questions.filter((question)=>question.questionType==='NAT').map((question)=>[question.id,natDraft(question)])));
    setAttempt(value);setNow(Date.now());
  },[]);
  const load=useCallback(async(signal?:AbortSignal)=>{
    if(!attemptId){setLoadState('error');return}setLoadState('loading');
    try{install(await getAttempt(attemptId,signal));setLoadState('ready')}catch{if(!signal?.aborted)setLoadState('error')}
  },[attemptId,install]);
  useEffect(()=>{const controller=new AbortController();void load(controller.signal);return()=>controller.abort()},[load]);
  useEffect(()=>{currentIndexRef.current=currentIndex},[currentIndex]);

  const updateQuestion=useCallback((id:string,change:(question:AttemptQuestion)=>AttemptQuestion)=>{
    setAttempt((current)=>{if(!current)return current;const next={...current,questions:current.questions.map((question)=>question.id===id?change(question):question)};latestRef.current=next;return next});
  },[]);
  const saveQuestion=useCallback(async(id:string)=>{
    const current=latestRef.current,question=current?.questions.find((item)=>item.id===id);
    if(!current||!question||current.status!=='IN_PROGRESS')return;
    const timeout=debouncesRef.current[id];if(timeout)clearTimeout(timeout);delete debouncesRef.current[id];
    const version=versionsRef.current[id]??0;
    const payload={submittedAnswer:question.submittedAnswer,markedForReview:question.markedForReview,timeSeconds:question.timeSeconds};
    lastRequestedTimeRef.current[id]=payload.timeSeconds;
    setSaveStates((states)=>({...states,[id]:'Saving'}));
    const prior=chainsRef.current[id]??Promise.resolve();
    const work=prior.catch(()=>undefined).then(async()=>{
      try{
        const saved=await saveAttemptAnswer(current.id,id,payload);
        if(versionsRef.current[id]===version){
          const newerTime=(latestRef.current?.questions.find((item)=>item.id===id)?.timeSeconds??saved.timeSeconds)>saved.timeSeconds;
          updateQuestion(id,(item)=>({...item,submittedAnswer:saved.submittedAnswer,markedForReview:saved.markedForReview,timeSeconds:Math.max(item.timeSeconds,saved.timeSeconds)}));
          lastSavedTimeRef.current[id]=saved.timeSeconds;if(newerTime)dirtyRef.current.add(id);else dirtyRef.current.delete(id);serverOffsetRef.current=Date.parse(saved.serverNow)-Date.now();setSaveStates((states)=>({...states,[id]:'Saved'}));
        }
      }catch{if(versionsRef.current[id]===version){dirtyRef.current.add(id);setSaveStates((states)=>({...states,[id]:'Not saved'}))}}
    });
    chainsRef.current[id]=work;await work;
  },[updateQuestion]);
  const scheduleSave=useCallback((id:string,delay=450)=>{dirtyRef.current.add(id);const old=debouncesRef.current[id];if(old)clearTimeout(old);debouncesRef.current[id]=setTimeout(()=>void saveQuestion(id),delay)},[saveQuestion]);
  const changeQuestion=useCallback((id:string,change:(question:AttemptQuestion)=>AttemptQuestion,immediate=false)=>{versionsRef.current[id]=(versionsRef.current[id]??0)+1;updateQuestion(id,change);scheduleSave(id,immediate?0:450)},[scheduleSave,updateQuestion]);
  const flush=useCallback(async()=>{const current=latestRef.current;if(!current)return true;const ids=new Set(dirtyRef.current);const active=current.questions[currentIndexRef.current];if(active)ids.add(active.id);await Promise.all([...ids].map((id)=>saveQuestion(id)));await Promise.all(Object.values(chainsRef.current));return dirtyRef.current.size===0},[saveQuestion]);

  useEffect(()=>{const timer=setInterval(()=>{
    setNow(Date.now());const current=latestRef.current;if(!current||current.status!=='IN_PROGRESS'||trackingPausedRef.current)return;
    const elapsed=Math.floor((Date.now()-lastTickRef.current)/1000);if(elapsed<1)return;lastTickRef.current+=elapsed*1000;
    const question=current.questions[currentIndexRef.current];if(!question)return;const nextTime=Math.min(current.test.durationMinutes*60,question.timeSeconds+elapsed);
    updateQuestion(question.id,(item)=>({...item,timeSeconds:nextTime}));dirtyRef.current.add(question.id);
    if(nextTime-(lastRequestedTimeRef.current[question.id]??0)>=15)void saveQuestion(question.id);
  },1000);return()=>clearInterval(timer)},[saveQuestion,updateQuestion]);
  useEffect(()=>{const onVisibility=()=>{if(document.visibilityState==='hidden'){const active=latestRef.current?.questions[currentIndexRef.current];if(active)void saveQuestion(active.id)}};const onUnload=()=>{const active=latestRef.current?.questions[currentIndexRef.current];if(active)void saveQuestion(active.id)};document.addEventListener('visibilitychange',onVisibility);window.addEventListener('beforeunload',onUnload);return()=>{document.removeEventListener('visibilitychange',onVisibility);window.removeEventListener('beforeunload',onUnload)}},[saveQuestion]);
  useEffect(()=>()=>{for(const timeout of Object.values(debouncesRef.current))clearTimeout(timeout)},[]);

  const remaining=attempt?.status==='IN_PROGRESS'?Math.max(0,Math.ceil((Date.parse(attempt.expiresAt)-(now+serverOffsetRef.current))/1000)):0;
  useEffect(()=>{if(!attempt||attempt.status!=='IN_PROGRESS')return;for(const threshold of[300,60])if(remaining<=threshold&&!announcedRef.current.has(threshold)){announcedRef.current.add(threshold);setNotice(threshold===300?'Five minutes remaining.':'One minute remaining.')}if(remaining===0)setNotice('Time is up. Submitting your attempt.')},[attempt,remaining]);
  const completeSubmit=useCallback(async(auto=false)=>{const current=latestRef.current;if(!current||submitting)return;trackingPausedRef.current=true;setSubmitting(true);setSubmitOpen(false);try{if(!auto&&!await flush()){trackingPausedRef.current=false;lastTickRef.current=Date.now();setNotice('Some answers are not saved. Retry the failed save before submitting.');return}install(await submitAttempt(current.id))}catch{trackingPausedRef.current=false;lastTickRef.current=Date.now();setNotice('Submission could not be confirmed. Retry now.')}finally{setSubmitting(false)}},[flush,install,submitting]);
  useEffect(()=>{if(attempt?.status==='IN_PROGRESS'&&remaining===0&&!autoSubmitRef.current){autoSubmitRef.current=true;void completeSubmit(true)}},[attempt?.status,completeSubmit,remaining]);
  const go=async(index:number)=>{trackingPausedRef.current=true;const question=latestRef.current?.questions[currentIndex];if(question)await saveQuestion(question.id);setCurrentIndex(index);currentIndexRef.current=index;lastTickRef.current=Date.now();trackingPausedRef.current=false;setPaletteOpen(false)};
  const exit=async()=>{trackingPausedRef.current=true;if(!await flush()){trackingPausedRef.current=false;lastTickRef.current=Date.now();setExitOpen(false);setNotice('Some answers are not saved. Retry the failed save before exiting.');return}navigate('/test')};

  if(loadState==='loading')return <main className="attempt-shell"><p className="panel-state" role="status">Loading your attempt…</p></main>;
  if(loadState==='error'||!attempt)return <main className="attempt-shell"><div className="attempt-load-error" role="alert"><h1>Couldn’t load this attempt</h1><p>Your saved answers have not been changed.</p><button className="primary-button" onClick={()=>void load()} type="button">Retry</button><button className="secondary-button" onClick={()=>navigate('/test')} type="button">Back to Tests</button></div></main>;
  const current=attempt.questions[currentIndex]??attempt.questions[0];
  if(!current)return <main className="attempt-shell"><div className="attempt-load-error"><h1>No questions available</h1><button onClick={()=>navigate('/test')} type="button">Back to Tests</button></div></main>;
  const answeredCount=attempt.questions.filter(answered).length,reviewCount=attempt.questions.filter((question)=>question.markedForReview).length,disabled=attempt.status!=='IN_PROGRESS'||submitting||remaining===0;
  if(attempt.status==='SUBMITTED')return <main className="attempt-shell attempt-shell--submitted"><article className="submitted-card"><p className="eyebrow">ATTEMPT SUBMITTED</p><h1>{attempt.test.name}</h1><p>Your responses are saved and this attempt is now immutable.</p><dl><div><dt>Answered</dt><dd>{answeredCount} of {attempt.questions.length}</dd></div><div><dt>Time used</dt><dd>{formatClock(attempt.totalTimeSeconds??0)}</dd></div></dl><div className="submitted-card__actions"><button className="primary-button" onClick={()=>navigate(`/results/${attempt.id}`)} type="button">View Results</button><button className="secondary-button" onClick={()=>navigate('/test')} type="button">Back to Tests</button></div></article></main>;
  const currentSave=saveStates[current.id],importantNotice=remaining===0||notice.includes('not saved')||notice.includes('could not');
  const onOption=(key:string,checked:boolean)=>changeQuestion(current.id,(item)=>{const keys=optionKeys(item.submittedAnswer);const values=item.questionType==='MCQ'?(checked?[key]:[]):(checked?[...keys,key]:keys.filter((value)=>value!==key));return{...item,submittedAnswer:{optionKeys:[...new Set(values)]}}});
  const onDraft=(value:string)=>{if(!/^-?\d*\.?\d*$/.test(value))return;setDrafts((all)=>({...all,[current.id]:value}));const numeric=['','-','.','-.'].includes(value)?null:Number(value);if(numeric===null||Number.isFinite(numeric))changeQuestion(current.id,(item)=>({...item,submittedAnswer:{value:numeric}}))};
  const clear=()=>{setDrafts((all)=>({...all,[current.id]:''}));changeQuestion(current.id,(item)=>({...item,submittedAnswer:item.questionType==='NAT'?{value:null}:{optionKeys:[]}}),true)};

  return <main className="attempt-shell">
    <header className="attempt-header"><button className="attempt-exit" onClick={()=>setExitOpen(true)} type="button">Exit</button><div><strong>{attempt.test.name}</strong><span>Question {currentIndex+1} of {attempt.questions.length}</span></div><time aria-label={`${remaining} seconds remaining`} className="attempt-timer">{formatClock(remaining)}</time></header>
    <p className={importantNotice?'attempt-notice':'sr-only'} aria-live="polite">{notice}</p>
    <div className="attempt-workspace">
      <section className="attempt-question" aria-labelledby="attempt-question-title">
        <div className="attempt-question__meta"><span>{current.subject?.name??'Subject'} · {current.topic?.name??'Topic'}</span><span>{current.questionType} · {current.marks} {current.marks===1?'mark':'marks'}</span></div>
        <h1 id="attempt-question-title"><span>Question {current.position}</span>{current.questionText}</h1>
        {current.hasImage&&<img alt={`Reference for question ${current.position}`} className="attempt-question__image" src={questionImageUrl(current.id,attempt.startedAt)}/>}
        <AnswerControl disabled={disabled} draft={drafts[current.id]??''} question={current} onDraft={onDraft} onOption={onOption}/>
        <div className="attempt-save"><span>Time on question: {formatClock(current.timeSeconds)}</span><span aria-live="polite" className={currentSave==='Not saved'?'attempt-save--error':''}>{currentSave??'Saved locally'}{currentSave==='Not saved'&&<button onClick={()=>void saveQuestion(current.id)} type="button">Retry</button>}</span></div>
        <div className="question-actions"><button disabled={disabled} onClick={clear} type="button">Clear Answer</button><button aria-pressed={current.markedForReview} className={current.markedForReview?'review-button review-button--active':'review-button'} disabled={disabled} onClick={()=>changeQuestion(current.id,(item)=>({...item,markedForReview:!item.markedForReview}),true)} type="button">{current.markedForReview?'Unmark Review':'Mark for Review'}</button></div>
        <nav aria-label="Question navigation" className="attempt-navigation"><button disabled={currentIndex===0||disabled} onClick={()=>void go(currentIndex-1)} type="button">Previous</button><button className="palette-toggle" onClick={()=>setPaletteOpen(true)} type="button">Questions</button>{currentIndex<attempt.questions.length-1?<button disabled={disabled} onClick={()=>void go(currentIndex+1)} type="button">Next</button>:<button className="submit-button" disabled={disabled} onClick={()=>setSubmitOpen(true)} type="button">Submit Test</button>}</nav>
      </section>
      <QuestionPalette attempt={attempt} currentIndex={currentIndex} mobileOpen={paletteOpen} onClose={()=>setPaletteOpen(false)} onGo={(index)=>void go(index)} onSubmit={()=>setSubmitOpen(true)}/>
    </div>
    {exitOpen&&<div className="confirm-backdrop"><div aria-labelledby="exit-title" aria-modal="true" className="confirm-dialog" role="dialog"><h2 id="exit-title">Exit this test?</h2><p>Your saved answers remain, but the timer continues and does not pause.</p><div><button autoFocus className="secondary-button" onClick={()=>setExitOpen(false)} type="button">Stay</button><button className="primary-button" onClick={()=>void exit()} type="button">Exit to Tests</button></div></div></div>}
    {submitOpen&&<div className="confirm-backdrop"><div aria-labelledby="submit-title" aria-modal="true" className="confirm-dialog" role="dialog"><h2 id="submit-title">Submit this attempt?</h2><p>{answeredCount} answered · {attempt.questions.length-answeredCount} unanswered · {reviewCount} marked for review.</p><p>Submission is final. You cannot change answers afterward.</p><div><button autoFocus className="secondary-button" onClick={()=>setSubmitOpen(false)} type="button">Keep working</button><button className="primary-button" onClick={()=>void completeSubmit()} type="button">Confirm Submit</button></div></div></div>}
  </main>;
}

function AnswerControl({question,draft,disabled,onOption,onDraft}:{question:AttemptQuestion;draft:string;disabled:boolean;onOption:(key:string,checked:boolean)=>void;onDraft:(value:string)=>void}){
  if(question.questionType==='NAT')return <label className="nat-answer"><span>Numeric answer</span><input aria-label="Numeric answer" disabled={disabled} inputMode="decimal" onChange={(event)=>onDraft(event.target.value)} placeholder="Enter a number" type="text" value={draft}/></label>;
  const keys=optionKeys(question.submittedAnswer);
  return <fieldset className="option-answers"><legend>Select {question.questionType==='MCQ'?'one answer':'all that apply'}</legend>{question.options.map((option)=><label key={option.key}><input checked={keys.includes(option.key)} disabled={disabled} name={question.questionType==='MCQ'?`question-${question.id}`:undefined} onChange={(event)=>onOption(option.key,event.target.checked)} type={question.questionType==='MCQ'?'radio':'checkbox'}/><strong>{option.key}</strong><span>{option.text}</span></label>)}</fieldset>;
}

function QuestionPalette({attempt,currentIndex,mobileOpen,onClose,onGo,onSubmit}:{attempt:TestAttempt;currentIndex:number;mobileOpen:boolean;onClose:()=>void;onGo:(index:number)=>void;onSubmit:()=>void}){
  return <aside aria-label="Question palette" className={mobileOpen?'question-palette question-palette--open':'question-palette'}><div className="question-palette__heading"><div><h2>Questions</h2><p>{attempt.questions.filter(answered).length} of {attempt.questions.length} answered</p></div><button aria-label="Close question palette" className="palette-close" onClick={onClose} type="button">×</button></div><div className="question-palette__grid">{attempt.questions.map((question,index)=>{const isAnswered=answered(question),state=question.markedForReview?(isAnswered?'Answered + Review':'Review'):(isAnswered?'Answered':'Not Answered');return <button aria-current={index===currentIndex?'step':undefined} aria-label={`Question ${index+1}: ${state}${index===currentIndex?', current':''}`} className={`palette-question palette-question--${state.toLowerCase().replaceAll(' ','-').replace('+','plus')}${index===currentIndex?' palette-question--current':''}`} key={question.id} onClick={()=>onGo(index)} type="button"><span>{index+1}</span><small>{state}{index===currentIndex?' · Current':''}</small></button>})}</div><div className="palette-legend"><span>○ Not Answered</span><span>● Answered</span><span>◆ Review</span><span>★ Answered + Review</span></div><button className="submit-button question-palette__submit" onClick={onSubmit} type="button">Submit Test</button></aside>;
}
