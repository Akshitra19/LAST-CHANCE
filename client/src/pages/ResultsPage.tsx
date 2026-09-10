import { m } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getResults } from '../lib/api';
import { formatDateTime, formatDuration, testTypeLabel } from '../lib/results';
import { testTypes, type TestType } from '../types/test';
import type { ResultList } from '../types/result';
import { DelayedPageSkeleton, InlineSpinner } from '../components/feedback/Loading';
import { motionTokens } from '../lib/experience';

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Math.max(1, Number(searchParams.get('page')) || 1);
  const initialType = testTypes.includes(searchParams.get('testType') as TestType) ? searchParams.get('testType') as TestType : '';
  const [page, setPage] = useState(initialPage);
  const [testType, setTestType] = useState<TestType | ''>(initialType);
  const [result, setResult] = useState<ResultList | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const testId = searchParams.get('testId') ?? undefined;
  const load = useCallback(async (signal?: AbortSignal) => {
    setState('loading');
    try {
      setResult(await getResults({ page, pageSize: 20, ...(testType ? { testType } : {}), ...(testId ? { testId } : {}) }, signal));
      setState('ready');
    } catch { if (!signal?.aborted) setState('error'); }
  }, [page, testId, testType]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (page > 1) next.set('page', String(page));
    if (testType) next.set('testType', testType);
    if (testId) next.set('testId', testId);
    setSearchParams(next, { replace: true });
  }, [page, setSearchParams, testId, testType]);
  return <section className="results-page" aria-labelledby="results-title">
    <header className="results-header"><div><p className="eyebrow">TEST · RESULTS</p><h1 id="results-title">Results</h1><p>Review submitted tests and understand each outcome.</p></div><Link className="secondary-link" to="/test">Back to Tests</Link></header>
    <div className="result-filters"><label>Test type<select value={testType} onChange={(event) => { setTestType(event.target.value as TestType | ''); setPage(1); }}><option value="">All test types</option>{testTypes.map((value) => <option key={value} value={value}>{testTypeLabel(value)}</option>)}</select></label>{testId && <button className="filter-clear" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('testId'); setSearchParams(next); setPage(1); }} type="button">Clear test filter</button>}</div>
    <DelayedPageSkeleton cards={3} label="Loading results" pending={state==='loading'&&!result}/>{state==='loading'&&result&&<InlineSpinner label="Updating results"/>}
    {state === 'error' && <div className="panel-state" role="alert"><p>Couldn't load Results. No scores were substituted or changed.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button></div>}
    {state === 'ready' && result?.items.length === 0 && <div className="results-empty"><h2>No submitted tests yet.</h2><p>Complete a test to see its score and question review here.</p><Link className="primary-link" to="/test">Open Tests</Link></div>}
    {state !== 'error' && result && result.items.length > 0 && <div className="result-history" aria-busy={state==='loading'}>{result.items.map((item, index) => <m.article animate={{ opacity: 1, y: 0 }} className="result-history-card" initial={{ opacity: 0, y: 5 }} key={item.attemptId} transition={{ delay: Math.min(index, 10) * motionTokens.stagger, duration: motionTokens.standard, ease: motionTokens.ease }}>
      <div className="result-history-card__heading"><div><span>{testTypeLabel(item.testType)}</span><h2>{item.testName}</h2></div><p aria-label={`Score ${item.score.toFixed(2)} out of ${item.totalMarks.toFixed(2)}`}><strong>{item.score.toFixed(2)}</strong> / {item.totalMarks.toFixed(2)}</p></div>
      <dl className="result-counts"><div><dt>Correct</dt><dd>{item.correctCount}</dd></div><div><dt>Wrong</dt><dd>{item.wrongCount}</dd></div><div><dt>Skipped</dt><dd>{item.skippedCount}</dd></div></dl>
      <p>{item.accuracy.toFixed(2)}% accuracy · {formatDuration(item.totalTimeSeconds)}</p><time dateTime={item.submittedAt}>{formatDateTime(item.submittedAt)}</time>
      <Link className="primary-link" to={`/results/${item.attemptId}`}>View Result</Link>
    </m.article>)}</div>}
    {result && result.totalPages > 0 && <nav aria-label="Result pages" className="question-pagination"><button disabled={page <= 1 || state === 'loading'} onClick={() => setPage((value) => value - 1)} type="button">Previous</button><span>Page {result.page} of {Math.max(1, result.totalPages)}</span><button disabled={page >= result.totalPages || state === 'loading'} onClick={() => setPage((value) => value + 1)} type="button">Next</button></nav>}
  </section>;
}
