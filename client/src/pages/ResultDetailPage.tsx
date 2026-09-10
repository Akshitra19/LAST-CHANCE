import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getResult, updateMistakeType } from '../lib/api';
import { formatDateTime, formatDuration, testTypeLabel } from '../lib/results';
import { ResultQuestionCard, type MistakeSaveState } from '../components/results/ResultQuestionCard';
import type { MistakeType, ResultDetail, ResultOutcome } from '../types/result';

export function ResultDetailPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState<ResultDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState<'ALL' | ResultOutcome>('ALL');
  const [saveStates, setSaveStates] = useState<Record<string, MistakeSaveState>>({});
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!attemptId) { setState('error'); return; }
    setState('loading');
    try { setResult(await getResult(attemptId, signal)); setState('ready'); }
    catch { if (!signal?.aborted) setState('error'); }
  }, [attemptId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  const saveMistake = async (questionId: string, mistakeType: MistakeType | null) => {
    if (!result || !attemptId) return;
    setResult({ ...result, questions: result.questions.map((item) => item.questionId === questionId ? { ...item, mistakeType } : item) });
    setSaveStates((values) => ({ ...values, [questionId]: 'saving' }));
    try {
      const saved = await updateMistakeType(attemptId, questionId, mistakeType);
      setResult((current) => current ? { ...current, questions: current.questions.map((item) => item.questionId === questionId ? { ...item, mistakeType: saved.mistakeType } : item) } : current);
      setSaveStates((values) => ({ ...values, [questionId]: 'saved' }));
    } catch { setSaveStates((values) => ({ ...values, [questionId]: 'error' })); }
  };
  if (state === 'loading') return <section className="result-detail"><p className="panel-state" role="status">Loading result…</p></section>;
  if (state === 'error' || !result) return <section className="result-detail"><div className="panel-state" role="alert"><h1>Couldn't load this result</h1><p>The result remains unchanged.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button><Link to="/results">Back to Results</Link></div></section>;
  const visible = result.questions.filter((question) => filter === 'ALL' || question.outcome === filter);
  return <section className="result-detail" aria-labelledby="result-title">
    <Link className="back-link" to="/results">← Back to Results</Link>
    <header className="result-detail__header"><div><p className="eyebrow">{testTypeLabel(result.testType)}</p><h1 id="result-title">{result.testName}</h1><time dateTime={result.submittedAt}>Submitted {formatDateTime(result.submittedAt)}</time></div><p className="result-score" aria-label={`Score ${result.score.toFixed(2)} out of ${result.totalMarks.toFixed(2)}`}><strong>{result.score.toFixed(2)}</strong><span>/ {result.totalMarks.toFixed(2)} raw marks</span></p></header>
    <dl className="result-summary-grid"><div><dt>Correct</dt><dd>{result.correctCount}</dd></div><div><dt>Wrong</dt><dd>{result.wrongCount}</dd></div><div><dt>Skipped</dt><dd>{result.skippedCount}</dd></div><div><dt>Attempted</dt><dd>{result.attemptedCount}</dd></div><div><dt>Accuracy</dt><dd>{result.accuracy.toFixed(2)}%</dd></div><div><dt>Time used</dt><dd>{formatDuration(result.totalTimeSeconds)}</dd></div></dl>
    <section className="subject-results" aria-labelledby="subject-results-title"><h2 id="subject-results-title">Subject breakdown</h2><div>{result.subjectBreakdown.map((subject) => <article key={subject.subjectId}><h3>{subject.subjectName}</h3><dl><div><dt>Questions</dt><dd>{subject.questionCount}</dd></div><div><dt>Correct</dt><dd>{subject.correctCount}</dd></div><div><dt>Wrong</dt><dd>{subject.wrongCount}</dd></div><div><dt>Skipped</dt><dd>{subject.skippedCount}</dd></div><div><dt>Accuracy</dt><dd>{subject.accuracy.toFixed(2)}%</dd></div><div><dt>Time</dt><dd>{formatDuration(subject.timeSeconds)}</dd></div></dl></article>)}</div></section>
    <section className="question-review" aria-labelledby="question-review-title"><div className="question-review__heading"><div><h2 id="question-review-title">Question review</h2><p>{visible.length} of {result.questionCount} questions</p></div><label>Show<select value={filter} onChange={(event) => setFilter(event.target.value as 'ALL' | ResultOutcome)}><option value="ALL">All</option><option value="CORRECT">Correct</option><option value="WRONG">Wrong</option><option value="SKIPPED">Skipped</option></select></label></div>
      {visible.length === 0 ? <p className="panel-state">No questions match this filter.</p> : <div className="result-question-list">{visible.map((question) => <ResultQuestionCard heading={`Question ${question.position}`} key={question.questionId} onMistakeChange={(value) => void saveMistake(question.questionId, value)} onRetry={() => void saveMistake(question.questionId, question.mistakeType)} question={question} saveState={saveStates[question.questionId]} />)}</div>}
    </section>
  </section>;
}
