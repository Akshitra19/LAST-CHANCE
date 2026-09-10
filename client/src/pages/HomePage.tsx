import { m } from 'motion/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DelayedPageSkeleton, InlineSpinner } from '../components/feedback/Loading';
import { getDailyTasks, getSettings, getSyllabus } from '../lib/api';
import { getCountdown, studyHoursForToday } from '../lib/date-only';
import { dailyMotivation, istDateKey, motionTokens } from '../lib/experience';
import { countSyllabusStatuses } from '../lib/syllabus-summary';
import type { DailyTask } from '../types/daily-task';
import type { SettingsData } from '../types/settings';
import { topicStatusLabels, type SyllabusData, type TopicStatus } from '../types/syllabus';

const displayedStatuses: TopicStatus[] = ['MASTERED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'WEAK', 'NOT_STARTED'];
type LoadState = 'loading' | 'ready' | 'error';

export function HomePage() {
  const [settings, setSettings] = useState<SettingsData | null>(null), [syllabus, setSyllabus] = useState<SyllabusData | null>(null), [tasks, setTasks] = useState<DailyTask[]>([]);
  const [settingsState, setSettingsState] = useState<LoadState>('loading'), [syllabusState, setSyllabusState] = useState<LoadState>('loading'), [tasksState, setTasksState] = useState<LoadState>('loading');
  const today = istDateKey();
  const loadSettings = useCallback(async () => { setSettingsState('loading'); try { setSettings(await getSettings()); setSettingsState('ready'); } catch { setSettingsState('error'); } }, []);
  const loadSyllabus = useCallback(async () => { setSyllabusState('loading'); try { setSyllabus(await getSyllabus()); setSyllabusState('ready'); } catch { setSyllabusState('error'); } }, []);
  const loadTasks = useCallback(async () => { setTasksState('loading'); try { setTasks(await getDailyTasks(today)); setTasksState('ready'); } catch { setTasksState('error'); } }, [today]);
  useEffect(() => { void loadSettings(); void loadSyllabus(); void loadTasks(); }, [loadSettings, loadSyllabus, loadTasks]);
  const countdown = useMemo(() => settings ? getCountdown(settings.examDate) : null, [settings]);
  const summary = useMemo(() => { if (!syllabus) return null; try { return countSyllabusStatuses(syllabus); } catch { return null; } }, [syllabus]);
  const done = tasks.filter((task) => task.status === 'DONE').length;
  const plannedMinutes = tasks.reduce((sum, task) => sum + task.plannedMinutes, 0);

  return <section className="dashboard dashboard--command" aria-labelledby="home-title">
    <header className="dashboard__header"><div><p className="eyebrow">LAST CHANCE · DAILY COMMAND</p><h1 id="home-title">Make today count.</h1><p>{dailyMotivation(today)}</p></div><span className="today-chip">{new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date())}</span></header>
    <div className="dashboard-grid">
      <m.section className="dashboard-card dashboard-card--exam dashboard-card--hero" transition={{ duration: motionTokens.standard }} whileHover={{ y: -2 }} aria-labelledby="exam-card-title"><h2 id="exam-card-title">Countdown</h2>{settingsState === 'loading' && <DelayedPageSkeleton cards={1} label="Loading exam settings" pending/>}{settingsState === 'error' && <CardError label="Couldn’t load exam settings." onRetry={loadSettings}/>} {settings && settingsState === 'ready' && <><p className="dashboard-card__kicker">{settings.examName}</p><p className="countdown" data-countdown-kind={countdown?.kind}>{countdown?.label}</p><p className="dashboard-card__detail">{settings.examDate ? `Exam date: ${settings.examDate}` : 'Set your exam date to activate the countdown.'}</p>{!settings.examDate&&<Link className="text-link" to="/settings">Set exam date</Link>}</>}</m.section>
      <section className="dashboard-card dashboard-card--today" aria-labelledby="today-card-title"><div className="card-heading"><div><h2 id="today-card-title">Today’s study</h2><p>{tasksState === 'ready' ? `${done} of ${tasks.length} tasks complete` : 'Your current daily plan'}</p></div><Link className="text-link" to={`/plan?date=${today}`}>Open plan</Link></div>{tasksState === 'loading'&&<InlineSpinner label="Loading today’s plan"/>}{tasksState === 'error'&&<CardError label="Couldn’t load today’s plan." onRetry={loadTasks}/>} {tasksState === 'ready'&&<>{tasks.length ? <><p className="metric">{plannedMinutes} <span>planned minutes</span></p><div aria-label={`${done} of ${tasks.length} tasks complete`} className="progress-track"><span style={{ width: `${Math.round(done / tasks.length * 100)}%` }}/></div><ul className="today-task-list">{tasks.slice(0,3).map((task)=><li key={task.id}><span className={`task-dot task-dot--${task.status.toLowerCase()}`}/><span>{task.topic?.name ?? task.subject?.name ?? task.taskType.replaceAll('_',' ')}</span><small>{task.plannedMinutes} min</small></li>)}</ul></> : <div className="compact-empty"><strong>No tasks planned yet.</strong><span>Give the day one clear next action.</span><Link to={`/plan?date=${today}`}>Plan today</Link></div>}</>}</section>
      <section className="dashboard-card" aria-labelledby="target-card-title"><h2 id="target-card-title">Daily target</h2>{settingsState === 'loading'&&<InlineSpinner label="Loading study target"/>}{settings&&settingsState==='ready'&&<><p className="metric">{studyHoursForToday(settings)} <span>{studyHoursForToday(settings)===1?'hour':'hours'}</span></p><p className="dashboard-card__detail">Target score: {settings.targetMarks}/100</p></>}{settingsState==='error'&&<p className="card-state">Unavailable independently of your plan.</p>}</section>
      <section className="dashboard-card dashboard-card--syllabus" aria-labelledby="status-card-title"><div className="card-heading"><div><h2 id="status-card-title">Syllabus pulse</h2>{summary&&<p>{summary.total} official topics</p>}</div><Link className="text-link" to="/syllabus">Open syllabus</Link></div>{syllabusState==='loading'&&<InlineSpinner label="Loading syllabus progress"/>}{syllabusState==='error'&&<CardError label="Couldn’t load syllabus progress." onRetry={loadSyllabus}/>} {syllabusState==='ready'&&summary&&<><div className="syllabus-pulse"><strong>{summary.counts.MASTERED} / {summary.total}</strong><span>topics mastered</span><div className="progress-track"><span style={{ width: `${Math.round(summary.counts.MASTERED / Math.max(1, summary.total) * 100)}%` }}/></div></div><dl className="status-grid status-grid--compact">{displayedStatuses.map((status)=><div key={status}><dt>{topicStatusLabels[status]}</dt><dd data-status={status}>{summary.counts[status]}</dd></div>)}</dl></>}</section>
    </div>
    <nav className="quick-actions" aria-label="Quick actions"><span>Quick actions</span><Link to="/plan">Plan</Link><Link to="/test">Test</Link><Link to="/analytics">Analytics</Link><Link to="/syllabus">Syllabus</Link></nav>
  </section>;
}

function CardError({ label, onRetry }: { label: string; onRetry: () => Promise<void> }) { return <div className="card-state card-state--error"><p>{label} No saved data was changed.</p><button className="inline-retry" onClick={()=>void onRetry()} type="button">Retry</button></div>; }
