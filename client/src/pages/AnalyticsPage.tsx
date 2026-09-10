import { useCallback, useEffect, useState } from 'react';
import { AnalyticsFilters } from '../components/analytics/AnalyticsFilters';
import { MistakeChart, OutcomesChart, PerformanceChart, StudyChart, SubjectChart, SyllabusChart } from '../components/analytics/AnalyticsCharts';
import { getAnalytics } from '../lib/api';
import type { AnalyticsRange, AnalyticsResponse, AnalyticsTestType } from '../types/analytics';
import { DelayedPageSkeleton, InlineSpinner } from '../components/feedback/Loading';

const pct = (value: number | null) => value === null ? '—' : `${value.toFixed(2)}%`;
const study = (minutes: number) => minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const testLabel = (value: string) => value === 'TOPIC' ? 'Topic' : value === 'CUSTOM' ? 'Custom' : 'Full Mock';
const highlightValue = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\w/g, (letter) => letter.toUpperCase());

export function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('30D'); const [testType, setTestType] = useState<AnalyticsTestType>('ALL');
  const [data, setData] = useState<AnalyticsResponse | null>(null); const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading'); const [retry, setRetry] = useState(0);
  const load = useCallback(async (signal?: AbortSignal) => { setState('loading'); try { setData(await getAnalytics({ range, testType }, signal)); setState('ready'); } catch { if (!signal?.aborted) setState('error'); } }, [range, testType]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load, retry]);
  return <section aria-labelledby="analytics-title" className="analytics-page">
    <header className="analytics-header"><div><p className="eyebrow">PREPARATION · FACTS</p><h1 id="analytics-title">Analytics</h1><p>Track test performance, study consistency, mistakes, and syllabus progress.</p></div>{data && <p className="analytics-timezone">Calendar boundaries: Asia/Kolkata</p>}</header>
    <AnalyticsFilters disabled={state === 'loading'} onRange={setRange} onTestType={setTestType} range={range} testType={testType}/>
    <DelayedPageSkeleton cards={4} label="Loading analytics" pending={state==='loading'&&!data}/>{state==='loading'&&data&&<InlineSpinner label="Updating analytics"/>}
    {state === 'error' && <div className="analytics-state" role="alert"><h2>Couldn’t load analytics.</h2><p>No metrics were substituted for the failed request.</p><button className="retry-button" onClick={() => setRetry((value) => value + 1)} type="button">Retry</button></div>}
    {state !== 'error' && data && <div aria-busy={state==='loading'}>
      <section aria-label="Analytics summary" className="analytics-metrics">
        <article><span>Tests Completed</span><strong>{data.summary.testsCompleted}</strong><small>submitted tests</small></article>
        <article><span>Average Test Score</span><strong>{pct(data.summary.averageScorePercent)}</strong><small>mean of per-test percentages</small></article>
        <article><span>Accuracy</span><strong>{pct(data.summary.accuracyPercent)}</strong><small>{data.summary.questionsAttempted} attempted questions</small></article>
        <article><span>Actual Study Time</span><strong>{study(data.summary.actualStudyMinutes)}</strong><small>{study(data.summary.plannedStudyMinutes)} planned · {pct(data.summary.studyAdherencePercent)} adherence</small></article>
      </section>
      <PerformanceChart data={data.performanceTrend} target={data.fullMockTargetMarks}/>
      <div className="analytics-grid analytics-grid--paired"><OutcomesChart data={data.outcomes}/><StudyChart actual={data.summary.actualStudyMinutes} adherence={data.summary.studyAdherencePercent} data={data.studyTrend} planned={data.summary.plannedStudyMinutes}/></div>
      <SubjectChart data={data.subjectPerformance}/>
      <div className="analytics-grid analytics-grid--paired"><MistakeChart data={data.mistakeBreakdown}/><SyllabusChart data={data.syllabusProgress}/></div>
      <section aria-labelledby="test-type-summary-title" className="analytics-table-card"><header><h2 id="test-type-summary-title">Test Type Summary</h2><p>Facts for the selected date and test-type filters.</p></header><div className="analytics-type-grid">{data.testTypeSummary.map((item) => <article key={item.testType}><h3>{testLabel(item.testType)}</h3><dl><div><dt>Tests</dt><dd>{item.testsCompleted}</dd></div><div><dt>Average score</dt><dd>{pct(item.averageScorePercent)}</dd></div><div><dt>Accuracy</dt><dd>{pct(item.accuracyPercent)}</dd></div></dl>{item.testsCompleted === 0 && <p>No data for these filters.</p>}</article>)}</div></section>
      <section aria-labelledby="highlights-title" className="analytics-table-card"><header><h2 id="highlights-title">Highlights</h2><p>Deterministic facts only — no predictions or recommendations.</p></header>{data.highlights.length ? <div className="analytics-highlights">{data.highlights.map((item) => <article key={item.key}><span>{item.label}</span><strong>{item.key === 'MOST_FREQUENT_MISTAKE' ? highlightValue(item.value) : item.value}</strong>{item.detail && <small>{item.detail}</small>}</article>)}</div> : <p className="analytics-empty">Complete tests or record Planner time to build factual highlights.</p>}</section>
    </div>}
  </section>;
}
