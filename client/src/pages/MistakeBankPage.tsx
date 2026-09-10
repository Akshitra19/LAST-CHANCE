import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createTest, getMistakes, getSyllabus, updateMistakeType } from '../lib/api';
import { ResultQuestionCard, type MistakeSaveState } from '../components/results/ResultQuestionCard';
import { formatDateTime } from '../lib/results';
import { mistakeLabels, mistakeTypes, type MistakeFilters, type MistakeItem, type MistakeList, type MistakeType } from '../types/result';
import type { SyllabusSubject } from '../types/syllabus';

export function MistakeBankPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<MistakeFilters>({ page: 1, pageSize: 20, outcome: 'ALL', mistakeType: 'ALL' });
  const [result, setResult] = useState<MistakeList | null>(null);
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [selected, setSelected] = useState<MistakeItem[]>([]);
  const [saveStates, setSaveStates] = useState<Record<string, MistakeSaveState>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testName, setTestName] = useState('Mistake Retry');
  const [duration, setDuration] = useState(30);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const load = useCallback(async (signal?: AbortSignal) => {
    setState('loading');
    try {
      const [mistakes, syllabus] = await Promise.all([getMistakes(filters, signal), getSyllabus(signal)]);
      setResult(mistakes); setSubjects(syllabus.subjects); setState('ready');
    } catch { if (!signal?.aborted) setState('error'); }
  }, [filters]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const selectedIds = useMemo(() => new Set(selected.map((item) => item.answerId)), [selected]);
  const setFilter = <K extends keyof MistakeFilters>(key: K, value: MistakeFilters[K]) => setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  const toggle = (item: MistakeItem) => setSelected((current) => current.some((value) => value.answerId === item.answerId) ? current.filter((value) => value.answerId !== item.answerId) : [...current, item]);
  const saveMistake = async (item: MistakeItem, mistakeType: MistakeType | null) => {
    setResult((current) => current ? { ...current, items: current.items.map((value) => value.answerId === item.answerId ? { ...value, mistakeType } : value) } : current);
    setSelected((current) => current.map((value) => value.answerId === item.answerId ? { ...value, mistakeType } : value));
    setSaveStates((values) => ({ ...values, [item.answerId]: 'saving' }));
    try {
      const saved = await updateMistakeType(item.attemptId, item.questionId, mistakeType);
      setResult((current) => current ? { ...current, items: current.items.map((value) => value.answerId === item.answerId ? { ...value, mistakeType: saved.mistakeType } : value) } : current);
      setSelected((current) => current.map((value) => value.answerId === item.answerId ? { ...value, mistakeType: saved.mistakeType } : value));
      setSaveStates((values) => ({ ...values, [item.answerId]: 'saved' }));
    } catch { setSaveStates((values) => ({ ...values, [item.answerId]: 'error' })); }
  };
  const uniqueQuestionIds = useMemo(() => {
    const seen = new Set<string>();
    return selected.flatMap((item) => item.retryEligible && !seen.has(item.questionId) ? (seen.add(item.questionId), [item.questionId]) : []);
  }, [selected]);
  const createRetry = async () => {
    setCreateError(''); setCreating(true);
    try {
      const test = await createTest({ name: testName, testType: 'CUSTOM', durationMinutes: duration, questionIds: uniqueQuestionIds });
      navigate(`/tests/${test.id}/start`);
    } catch { setCreateError("Couldn't create the retry test. Check the details and retry."); setCreating(false); }
  };
  const filtered = filters.outcome !== 'ALL' || filters.mistakeType !== 'ALL' || Boolean(filters.subjectId);
  return <section className="mistakes-page" aria-labelledby="mistakes-title">
    <header className="results-header"><div><p className="eyebrow">REVIEW · RETRY</p><h1 id="mistakes-title">Mistake Bank</h1><p>Review wrong and skipped answers, classify them, and build a focused retry test.</p></div><Link className="secondary-link" to="/results">Results</Link></header>
    <section className="mistake-filters" aria-label="Mistake filters">
      <label>Outcome<select value={filters.outcome} onChange={(event) => setFilter('outcome', event.target.value as MistakeFilters['outcome'])}><option value="ALL">All</option><option value="WRONG">Wrong</option><option value="SKIPPED">Skipped</option></select></label>
      <label>Mistake type<select value={filters.mistakeType} onChange={(event) => setFilter('mistakeType', event.target.value as MistakeFilters['mistakeType'])}><option value="ALL">All</option><option value="UNCLASSIFIED">Unclassified</option>{mistakeTypes.map((value) => <option key={value} value={value}>{mistakeLabels[value]}</option>)}</select></label>
      <label>Subject<select value={filters.subjectId ?? ''} onChange={(event) => setFilter('subjectId', event.target.value || undefined)}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
    </section>
    {state === 'loading' && <p className="panel-state" role="status">Loading mistakes…</p>}
    {state === 'error' && <div className="panel-state" role="alert"><p>Couldn't load mistakes.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button></div>}
    {state === 'ready' && result?.items.length === 0 && <div className="results-empty"><h2>{filtered ? 'No mistakes match these filters.' : 'No mistakes yet.'}</h2><p>Wrong and skipped answers from submitted tests will appear here.</p></div>}
    {state === 'ready' && result && result.items.length > 0 && <div className="mistake-list">{result.items.map((item, index) => <div className="mistake-entry" key={item.answerId}>
      <div className="mistake-entry__select"><label><input aria-label={`Select ${item.questionText} from ${item.testName} for retry`} checked={selectedIds.has(item.answerId)} disabled={!item.retryEligible} onChange={() => toggle(item)} type="checkbox"/><span>Select for retry</span></label><span>{item.testName} · {formatDateTime(item.submittedAt)}</span><Link to={`/results/${item.attemptId}`}>View full result</Link></div>
      <ResultQuestionCard heading={`Historical mistake ${index + 1}`} onMistakeChange={(value) => void saveMistake(item, value)} onRetry={() => void saveMistake(item, item.mistakeType)} question={item} saveState={saveStates[item.answerId]} />
    </div>)}</div>}
    {result && result.totalPages > 0 && <nav aria-label="Mistake pages" className="question-pagination"><button disabled={filters.page <= 1 || state === 'loading'} onClick={() => setFilters((value) => ({ ...value, page: value.page - 1 }))} type="button">Previous</button><span>Page {result.page} of {Math.max(1, result.totalPages)}</span><button disabled={filters.page >= result.totalPages || state === 'loading'} onClick={() => setFilters((value) => ({ ...value, page: value.page + 1 }))} type="button">Next</button></nav>}
    <div className="retry-bar"><p aria-live="polite">{selected.length} selected · {uniqueQuestionIds.length} unique eligible {uniqueQuestionIds.length === 1 ? 'question' : 'questions'}</p><button className="primary-button" disabled={uniqueQuestionIds.length === 0} onClick={() => setDialogOpen(true)} type="button">Retry Selected</button></div>
    {dialogOpen && <div className="confirm-backdrop" onKeyDown={(event) => { if (event.key === 'Escape' && !creating) setDialogOpen(false); }}><form aria-labelledby="retry-title" aria-modal="true" className="confirm-dialog retry-dialog" onSubmit={(event) => { event.preventDefault(); void createRetry(); }} role="dialog"><h2 id="retry-title">Create retry test</h2><p>{uniqueQuestionIds.length} unique active {uniqueQuestionIds.length === 1 ? 'question' : 'questions'} will be added to a normal Custom Test.</p><label>Test name<input autoFocus maxLength={200} minLength={1} onChange={(event) => setTestName(event.target.value)} required value={testName}/></label><label>Duration minutes<input max={600} min={1} onChange={(event) => setDuration(Number(event.target.value))} required type="number" value={duration}/></label>{createError && <div className="form-error" role="alert"><p>{createError}</p><button disabled={creating} type="submit">Retry</button></div>}<div><button className="secondary-button" disabled={creating} onClick={() => setDialogOpen(false)} type="button">Cancel</button><button className="primary-button" disabled={creating || uniqueQuestionIds.length === 0} type="submit">{creating ? 'Creating…' : 'Create Custom Test'}</button></div></form></div>}
  </section>;
}
