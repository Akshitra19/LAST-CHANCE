import { questionImageUrl } from '../../lib/api';
import { correctAnswerText, formatDuration, formatMarks, outcomeLabel, outcomeSymbol, submittedAnswerText } from '../../lib/results';
import { mistakeLabels, mistakeTypes, type MistakeType, type ResultQuestion } from '../../types/result';

export type MistakeSaveState = 'saving' | 'saved' | 'error' | undefined;

export function ResultQuestionCard({
  question,
  heading,
  saveState,
  onMistakeChange,
  onRetry
}: {
  question: Omit<ResultQuestion, 'position' | 'isCorrect'>;
  heading: string;
  saveState?: MistakeSaveState;
  onMistakeChange: (value: MistakeType | null) => void;
  onRetry: () => void;
}) {
  const selectId = `mistake-${question.questionId}-${heading.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <article className={`result-question result-question--${question.outcome.toLowerCase()}`} data-question-id={question.questionId}>
      <header className="result-question__header">
        <div>
          <p>{question.subject.name} · {question.topic.name}</p>
          <h3>{heading}</h3>
        </div>
        <span className={`outcome-badge outcome-badge--${question.outcome.toLowerCase()}`}>{outcomeSymbol(question.outcome)} {outcomeLabel(question.outcome)}</span>
      </header>
      <p className="result-question__meta">{question.questionType} · {question.marks} {question.marks === 1 ? 'mark' : 'marks'} · {formatDuration(question.timeSeconds)}{question.markedForReview ? ' · Marked for review' : ''}</p>
      <p className="result-question__text">{question.questionText}</p>
      {question.hasImage && <img alt={`Reference for ${heading.toLowerCase()}`} className="result-question__image" src={questionImageUrl(question.questionId, question.submittedAnswer ? String(question.timeSeconds) : undefined)} />}
      {question.options.length > 0 && <ol className="result-options">{question.options.map((option) => <li key={option.key}><strong>{option.key}.</strong> {option.text}</li>)}</ol>}
      <dl className="answer-review">
        <div><dt>Your answer</dt><dd>{submittedAnswerText(question.submittedAnswer, question.options)}</dd></div>
        <div><dt>Correct answer</dt><dd>{correctAnswerText(question.correctAnswer, question.options)}</dd></div>
        <div><dt>Marks awarded</dt><dd>{formatMarks(question.marksAwarded)}</dd></div>
      </dl>
      <section className="result-explanation" aria-label="Explanation"><h4>Explanation</h4><p>{question.explanation?.trim() || 'No explanation added.'}</p></section>
      {question.outcome !== 'CORRECT' && <div className="mistake-control">
        <label htmlFor={selectId}>Mistake classification</label>
        <select disabled={saveState === 'saving'} id={selectId} value={question.mistakeType ?? ''} onChange={(event) => onMistakeChange(event.target.value ? event.target.value as MistakeType : null)}>
          <option value="">Not classified</option>
          {mistakeTypes.map((value) => <option key={value} value={value}>{mistakeLabels[value]}</option>)}
        </select>
        <span aria-live="polite" className={saveState === 'error' ? 'mistake-save mistake-save--error' : 'mistake-save'}>
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? "Couldn't save classification." : ''}
          {saveState === 'error' && <button onClick={onRetry} type="button">Retry</button>}
        </span>
      </div>}
      {!question.retryEligible && <p className="archived-note">Archived — restore in Question Bank to retry.</p>}
    </article>
  );
}
