import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, getSyllabus } from '../lib/api';
import { getCountdown, studyHoursForToday } from '../lib/date-only';
import { countSyllabusStatuses } from '../lib/syllabus-summary';
import { topicStatusLabels, type SyllabusData, type TopicStatus } from '../types/syllabus';
import type { SettingsData } from '../types/settings';

const displayedStatuses: TopicStatus[] = ['MASTERED', 'LEARNING', 'PRACTICING', 'PYQ', 'REVISING', 'WEAK', 'NOT_STARTED'];

export function HomePage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [settingsState, setSettingsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [syllabusState, setSyllabusState] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadSettings = useCallback(async () => { setSettingsState('loading'); try { setSettings(await getSettings()); setSettingsState('ready'); } catch { setSettingsState('error'); } }, []);
  const loadSyllabus = useCallback(async () => { setSyllabusState('loading'); try { setSyllabus(await getSyllabus()); setSyllabusState('ready'); } catch { setSyllabusState('error'); } }, []);
  useEffect(() => { void loadSettings(); void loadSyllabus(); }, [loadSettings, loadSyllabus]);
  const countdown = useMemo(() => settings ? getCountdown(settings.examDate) : null, [settings]);
  const summary = useMemo(() => { if (!syllabus) return null; try { return countSyllabusStatuses(syllabus); } catch { return null; } }, [syllabus]);

  return <section className="dashboard" aria-labelledby="home-title">
    <header className="dashboard__header"><p className="eyebrow">LAST CHANCE</p><h1 id="home-title">Today’s focus</h1><p>Keep the plan clear. Work the syllabus.</p></header>
    <div className="dashboard-grid">
      <section className="dashboard-card dashboard-card--exam" aria-labelledby="exam-card-title"><h2 id="exam-card-title">Exam</h2>
        {settingsState === 'loading' && <p className="card-state" role="status">Loading exam settings…</p>}
        {settingsState === 'error' && <CardError label="Couldn’t load exam settings." onRetry={loadSettings} />}
        {settings && settingsState === 'ready' && <><p className="dashboard-card__kicker">{settings.examName}</p><p className="countdown" data-countdown-kind={countdown?.kind}>{countdown?.label}</p>{settings.examDate ? <p className="dashboard-card__detail">Exam date: {settings.examDate}</p> : <Link className="text-link" to="/settings">Set exam date</Link>}</>}
      </section>
      <section className="dashboard-card" aria-labelledby="target-card-title"><h2 id="target-card-title">Target</h2>{settingsState === 'loading' && <p className="card-state">Loading…</p>}{settings && settingsState === 'ready' && <p className="metric" data-target-marks={settings.targetMarks}>{settings.targetMarks} <span>/ 100</span></p>}{settingsState === 'error' && <p className="card-state">Unavailable</p>}</section>
      <section className="dashboard-card" aria-labelledby="study-card-title"><h2 id="study-card-title">Today’s study target</h2>{settingsState === 'loading' && <p className="card-state">Loading…</p>}{settings && settingsState === 'ready' && <p className="metric" data-study-hours={studyHoursForToday(settings)}>{studyHoursForToday(settings)} <span>{studyHoursForToday(settings) === 1 ? 'hour' : 'hours'}</span></p>}{settingsState === 'error' && <p className="card-state">Unavailable</p>}</section>
      <section className="dashboard-card dashboard-card--syllabus" aria-labelledby="status-card-title"><div className="card-heading"><div><h2 id="status-card-title">Syllabus status</h2>{summary && <p>{summary.total} official topics</p>}</div><Link className="text-link" to="/syllabus">View syllabus</Link></div>
        {syllabusState === 'loading' && <p className="card-state" role="status">Loading syllabus status…</p>}
        {syllabusState === 'error' && <CardError label="Couldn’t load syllabus status." onRetry={loadSyllabus} />}
        {syllabusState === 'ready' && summary && <dl className="status-grid">{displayedStatuses.map((status) => <div key={status}><dt>{topicStatusLabels[status]}</dt><dd data-status={status}>{summary.counts[status]}</dd></div>)}</dl>}
        {syllabusState === 'ready' && !summary && <CardError label="Syllabus status is unavailable." onRetry={loadSyllabus} />}
      </section>
    </div>
    <nav className="dashboard-actions" aria-label="Dashboard shortcuts"><Link className="primary-link" to="/syllabus">View syllabus</Link><Link className="secondary-link" to="/settings">Open settings</Link></nav>
  </section>;
}

function CardError({ label, onRetry }: { label: string; onRetry: () => Promise<void> }) {
  return <div className="card-state card-state--error"><p>{label}</p><button className="inline-retry" onClick={() => void onRetry()} type="button">Retry</button></div>;
}
