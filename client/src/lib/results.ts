import type { QuestionCorrectAnswer, QuestionOption } from '../types/question';
import type { SubmittedAnswer } from '../types/attempt';
import type { ResultOutcome } from '../types/result';
import type { TestType } from '../types/test';

export const testTypeLabel = (value: TestType): string => value === 'TOPIC' ? 'Topic Test' : value === 'CUSTOM' ? 'Custom Test' : 'Full Mock';
export const outcomeLabel = (value: ResultOutcome): string => value === 'CORRECT' ? 'Correct' : value === 'WRONG' ? 'Wrong' : 'Skipped';
export const outcomeSymbol = (value: ResultOutcome): string => value === 'CORRECT' ? '✓' : value === 'WRONG' ? '✕' : '—';
export const formatDuration = (seconds: number): string => {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remaining = safe % 60;
  return hours ? `${hours}h ${minutes}m ${remaining}s` : `${minutes}m ${remaining}s`;
};
export const formatMarks = (value: number): string => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;
export const formatDateTime = (value: string): string => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function optionsText(keys: string[], options: QuestionOption[]): string {
  const byKey = new Map(options.map((option) => [option.key, option.text]));
  return keys.map((key) => `${key}. ${byKey.get(key as QuestionOption['key']) ?? 'Unknown option'}`).join(', ');
}

export function submittedAnswerText(answer: SubmittedAnswer, options: QuestionOption[]): string {
  if ('value' in answer) return answer.value === null ? 'Not answered' : String(answer.value);
  return answer.optionKeys.length ? optionsText(answer.optionKeys, options) : 'Not answered';
}

export function correctAnswerText(answer: QuestionCorrectAnswer, options: QuestionOption[]): string {
  if ('min' in answer) return answer.min === answer.max ? String(answer.min) : `Accepted range: ${answer.min} – ${answer.max}`;
  return optionsText(answer.optionKeys, options);
}
