import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { getSettings, updateSettings } from '../lib/api';
import { parseDateOnly } from '../lib/date-only';
import type { SettingsData, SettingsPatch } from '../types/settings';
import { useUnsavedChanges } from '../components/experience/ExperienceProvider';
import { DelayedPageSkeleton } from '../components/feedback/Loading';

type FormValues = { examDate: string; targetMarks: string; weekdayStudyHours: string; saturdayStudyHours: string; sundayStudyHours: string; mondayStudyHours: string };
const toForm = (data: SettingsData): FormValues => ({ examDate: data.examDate ?? '', targetMarks: String(data.targetMarks), weekdayStudyHours: String(data.weekdayStudyHours), saturdayStudyHours: String(data.saturdayStudyHours), sundayStudyHours: String(data.sundayStudyHours), mondayStudyHours: String(data.mondayStudyHours) });

function validate(values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.examDate && !parseDateOnly(values.examDate)) errors.examDate = 'Enter a valid date.';
  const check = (key: keyof Omit<FormValues, 'examDate'>, max: number, label: string) => { const number = Number(values[key]); if (values[key].trim() === '' || !Number.isFinite(number) || number < 0 || number > max) errors[key] = `${label} must be between 0 and ${max}.`; };
  check('targetMarks', 100, 'Target marks'); check('weekdayStudyHours', 24, 'Study hours'); check('saturdayStudyHours', 24, 'Study hours'); check('sundayStudyHours', 24, 'Study hours'); check('mondayStudyHours', 24, 'Study hours');
  return errors;
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [values, setValues] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const load = useCallback(async () => { setLoading(true); setLoadError(false); try { const data = await getSettings(); setSettings(data); setValues(toForm(data)); } catch { setLoadError(true); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const errors = useMemo(() => values ? validate(values) : {}, [values]);
  const dirty = Boolean(settings && values && JSON.stringify(values) !== JSON.stringify(toForm(settings)));
  useUnsavedChanges('settings', dirty);
  const change = (key: keyof FormValues, value: string) => { setValues((current) => current ? { ...current, [key]: value } : current); setSaveMessage(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (!settings || !values || !dirty || saving || Object.keys(errors).length) return;
    const next = { examDate: values.examDate || null, targetMarks: Number(values.targetMarks), weekdayStudyHours: Number(values.weekdayStudyHours), saturdayStudyHours: Number(values.saturdayStudyHours), sundayStudyHours: Number(values.sundayStudyHours), mondayStudyHours: Number(values.mondayStudyHours) };
    const original = { examDate: settings.examDate, targetMarks: settings.targetMarks, weekdayStudyHours: settings.weekdayStudyHours, saturdayStudyHours: settings.saturdayStudyHours, sundayStudyHours: settings.sundayStudyHours, mondayStudyHours: settings.mondayStudyHours };
    const changes = Object.fromEntries(Object.entries(next).filter(([key, value]) => value !== original[key as keyof typeof original])) as SettingsPatch;
    if (!Object.keys(changes).length) return;
    setSaving(true); setSaveMessage('');
    try { const saved = await updateSettings(changes); setSettings(saved); setValues(toForm(saved)); setSaveMessage('Settings saved.'); }
    catch { setSaveMessage('Couldn’t save settings. Try again.'); }
    finally { setSaving(false); }
  };
  return <section className="settings-page" aria-labelledby="settings-title"><p className="eyebrow">LAST CHANCE</p><h1 id="settings-title">Settings</h1>
    <DelayedPageSkeleton cards={2} label="Loading settings" pending={loading}/>
    {!loading && loadError && <div className="panel-state" role="alert"><p>Couldn’t load settings.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button></div>}
    {!loading && settings && values && <form className="settings-form" onSubmit={(event) => void submit(event)} noValidate>
      <fieldset><legend>Exam</legend><div className="form-field"><label htmlFor="exam-name">Exam name</label><input id="exam-name" readOnly value={settings.examName} /></div><div className="form-field"><label htmlFor="exam-date">Exam date</label><input aria-describedby={errors.examDate ? 'exam-date-error' : undefined} id="exam-date" onChange={(event) => change('examDate', event.target.value)} type="date" value={values.examDate} />{errors.examDate && <span className="field-error" id="exam-date-error">{errors.examDate}</span>}</div></fieldset>
      <fieldset><legend>Goal</legend><NumberField error={errors.targetMarks} id="target-marks" label="Target marks" max={100} onChange={(value) => change('targetMarks', value)} value={values.targetMarks} /></fieldset>
      <fieldset><legend>Study hours</legend><NumberField error={errors.weekdayStudyHours} id="weekday-hours" label="Tuesday–Friday" max={24} onChange={(value) => change('weekdayStudyHours', value)} value={values.weekdayStudyHours} /><NumberField error={errors.saturdayStudyHours} id="saturday-hours" label="Saturday" max={24} onChange={(value) => change('saturdayStudyHours', value)} value={values.saturdayStudyHours} /><NumberField error={errors.sundayStudyHours} id="sunday-hours" label="Sunday" max={24} onChange={(value) => change('sundayStudyHours', value)} value={values.sundayStudyHours} /><NumberField error={errors.mondayStudyHours} id="monday-hours" label="Monday" max={24} onChange={(value) => change('mondayStudyHours', value)} value={values.mondayStudyHours} /></fieldset>
      <div className="settings-form__actions"><button className="primary-button" disabled={!dirty || saving || Object.keys(errors).length > 0} type="submit">{saving ? 'Saving…' : 'Save settings'}</button><span aria-live="polite" className={saveMessage.startsWith('Couldn') ? 'save-message save-message--error' : 'save-message'} role="status">{saveMessage}</span></div>
    </form>}
  </section>;
}

function NumberField({ id, label, value, max, error, onChange }: { id: string; label: string; value: string; max: number; error?: string; onChange: (value: string) => void }) {
  const errorId = `${id}-error`;
  return <div className="form-field"><label htmlFor={id}>{label}</label><input aria-describedby={error ? errorId : undefined} id={id} inputMode="decimal" max={max} min={0} onChange={(event) => onChange(event.target.value)} step="any" type="number" value={value} />{error && <span className="field-error" id={errorId}>{error}</span>}</div>;
}
