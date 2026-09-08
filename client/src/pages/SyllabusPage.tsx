import { useCallback, useEffect, useState } from 'react';
import { getSyllabus, updateTopicStatus } from '../lib/api';
import { topicStatuses, topicStatusLabels, type SyllabusData, type SyllabusSubject, type SyllabusTopic, type TopicStatus } from '../types/syllabus';

function replaceTopicStatus(topics: SyllabusTopic[], id: string, status: TopicStatus): SyllabusTopic[] {
  return topics.map((topic) => topic.id === id ? { ...topic, status } : { ...topic, children: replaceTopicStatus(topic.children, id, status) });
}

function TopicTree({ topics, pendingIds, errors, onStatusChange }: { topics: SyllabusTopic[]; pendingIds: Set<string>; errors: Record<string, string>; onStatusChange: (topic: SyllabusTopic, status: TopicStatus) => void }) {
  return <ul className="topic-tree">{topics.map((topic) => <li className="topic-item" data-topic-id={topic.id} key={topic.id}>
    <div className="topic-row">
      <div className="topic-row__name">{topic.name}</div>
      <label className={`status-control status-control--${topic.status.toLowerCase()}`}>
        <span className="sr-only">Status for {topic.name}</span>
        <select aria-label={`Status for ${topic.name}`} disabled={pendingIds.has(topic.id)} onChange={(event) => onStatusChange(topic, event.target.value as TopicStatus)} value={topic.status}>
          {topicStatuses.map((status) => <option key={status} value={status}>{topicStatusLabels[status]}</option>)}
        </select>
      </label>
    </div>
    {pendingIds.has(topic.id) && <span className="topic-message" role="status">Saving…</span>}
    {errors[topic.id] && <span className="topic-message topic-message--error" role="alert">{errors[topic.id]}</span>}
    {topic.children.length > 0 && <TopicTree errors={errors} onStatusChange={onStatusChange} pendingIds={pendingIds} topics={topic.children} />}
  </li>)}</ul>;
}

function SubjectSection({ subject, expanded, onToggle, pendingIds, errors, onStatusChange }: { subject: SyllabusSubject; expanded: boolean; onToggle: () => void; pendingIds: Set<string>; errors: Record<string, string>; onStatusChange: (topic: SyllabusTopic, status: TopicStatus) => void }) {
  const panelId = `subject-${subject.id}`;
  return <section className={`subject ${expanded ? 'subject--expanded' : ''}`}>
    <button aria-controls={panelId} aria-expanded={expanded} className="subject__toggle" onClick={onToggle} type="button"><span>{subject.name}</span><span aria-hidden="true" className="subject__chevron">⌄</span></button>
    {expanded && <div className="subject__content" id={panelId}><TopicTree errors={errors} onStatusChange={onStatusChange} pendingIds={pendingIds} topics={subject.topics} /></div>}
  </section>;
}

export function SyllabusPage() {
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [mutationErrors, setMutationErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true); setLoadError(false);
    try { const data = await getSyllabus(); setSyllabus(data); setExpanded((current) => current.size ? current : new Set(data.subjects[0] ? [data.subjects[0].id] : [])); }
    catch { setLoadError(true); setSyllabus(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (topic: SyllabusTopic, status: TopicStatus) => {
    if (status === topic.status || pendingIds.has(topic.id)) return;
    setPendingIds((current) => new Set(current).add(topic.id));
    setMutationErrors((current) => { const next = { ...current }; delete next[topic.id]; return next; });
    try { const saved = await updateTopicStatus(topic.id, status); setSyllabus((current) => current ? { ...current, subjects: current.subjects.map((subject) => ({ ...subject, topics: replaceTopicStatus(subject.topics, topic.id, saved.status) })) } : current); }
    catch { setMutationErrors((current) => ({ ...current, [topic.id]: 'Couldn’t update status. Try again.' })); }
    finally { setPendingIds((current) => { const next = new Set(current); next.delete(topic.id); return next; }); }
  };

  return (
    <section className="syllabus-page" aria-labelledby="syllabus-title">
      <p className="eyebrow">LAST CHANCE</p>
      <h1 id="syllabus-title">GATE 2027 Syllabus</h1>
      {loading && <p className="syllabus-state" role="status">Loading syllabus…</p>}
      {!loading && loadError && <div className="syllabus-state" role="alert"><p>Couldn’t load syllabus.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button></div>}
      {!loading && !loadError && syllabus && <>
        <p className="syllabus-summary">{syllabus.subjectCount} subjects <span aria-hidden="true">•</span> {syllabus.topicCount} topics</p>
        {syllabus.subjects.length === 0 ? <p className="syllabus-state">No syllabus data is available.</p> : <div className="subjects">{syllabus.subjects.map((subject) => <SubjectSection errors={mutationErrors} expanded={expanded.has(subject.id)} key={subject.id} onStatusChange={(topic, status) => void changeStatus(topic, status)} onToggle={() => setExpanded((current) => { const next = new Set(current); next.has(subject.id) ? next.delete(subject.id) : next.add(subject.id); return next; })} pendingIds={pendingIds} subject={subject} />)}</div>}
      </>}
    </section>
  );
}
