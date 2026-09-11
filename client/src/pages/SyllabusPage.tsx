import { AnimatePresence, m } from 'motion/react';
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { DelayedPageSkeleton } from '../components/feedback/Loading';
import { getSyllabus, updateTopicStatus } from '../lib/api';
import { motionTokens } from '../lib/experience';
import { countSyllabusStatuses } from '../lib/syllabus-summary';
import { topicStatuses, topicStatusLabels, type SyllabusData, type SyllabusSubject, type SyllabusTopic, type TopicStatus } from '../types/syllabus';

type TopicTreeProps = {
  topics: SyllabusTopic[];
  expandedIds: Set<string>;
  pendingIds: Set<string>;
  errors: Record<string, string>;
  masteredIds: Set<string>;
  onToggle: (id: string) => void;
  onStatusChange: (topic: SyllabusTopic, status: TopicStatus) => void;
};

function TopicTree({ topics, expandedIds, pendingIds, errors, masteredIds, onToggle, onStatusChange }: TopicTreeProps) {
  return <ul className="topic-tree">{topics.map((topic) => {
    const hasChildren = topic.children.length > 0;
    const expanded = hasChildren && expandedIds.has(topic.id);
    const childId = `topic-children-${topic.id}`;
    return <li className="topic-item" data-topic-id={topic.id} key={topic.id}>
      <div className={`topic-row ${hasChildren ? 'topic-row--parent' : 'topic-row--leaf'}`}>
        {hasChildren ? <button aria-controls={childId} aria-expanded={expanded} className="topic-row__toggle" onClick={() => onToggle(topic.id)} type="button"><span aria-hidden="true" className="topic-row__chevron">{expanded ? '−' : '+'}</span><span>{topic.name}</span></button> : <span className="topic-row__name">{topic.name}</span>}
        <span className={`topic-source topic-source--${topic.isOfficial ? 'official' : 'study'}`}>{topic.isOfficial ? 'Official' : 'Study'}</span>
        {hasChildren ? <span className={`topic-derived topic-derived--${topic.status.toLowerCase()}`}><strong>{topic.masteredLeafCount}/{topic.leafCount}</strong> mastered{topic.weakLeafCount > 0 ? ` · ${topic.weakLeafCount} weak` : ''}</span> : <label className={`status-control status-control--${topic.status.toLowerCase()}`}><span className="sr-only">Status for {topic.name}</span><select aria-label={`Status for ${topic.name}`} disabled={pendingIds.has(topic.id)} onChange={(event) => onStatusChange(topic, event.target.value as TopicStatus)} value={topic.status}>{topicStatuses.map((status) => <option key={status} value={status}>{topicStatusLabels[status]}</option>)}</select></label>}
      </div>
      {pendingIds.has(topic.id) && <span className="topic-message" role="status">Saving…</span>}
      {masteredIds.has(topic.id) && <m.span animate={{ opacity: 1, y: 0 }} className="topic-message topic-message--mastered" initial={{ opacity: 0, y: 3 }} role="status">Mastered. Keep it warm with revision.</m.span>}
      {errors[topic.id] && <span className="topic-message topic-message--error" role="alert">{errors[topic.id]}</span>}
      {expanded && <div id={childId}><TopicTree errors={errors} expandedIds={expandedIds} masteredIds={masteredIds} onStatusChange={onStatusChange} onToggle={onToggle} pendingIds={pendingIds} topics={topic.children}/></div>}
    </li>;
  })}</ul>;
}

function SubjectSection(props: { subject: SyllabusSubject; expanded: boolean; onToggle: () => void; expandedTopicIds: Set<string>; onTopicToggle: (id:string)=>void; pendingIds: Set<string>; errors: Record<string,string>; masteredIds: Set<string>; onStatusChange: (topic:SyllabusTopic,status:TopicStatus)=>void }) {
  const { subject, expanded, onToggle, expandedTopicIds, onTopicToggle, pendingIds, errors, masteredIds, onStatusChange } = props;
  const panelId = `subject-${subject.id}`;
  return <section className={`subject ${expanded ? 'subject--expanded' : ''}`}><h2><button aria-controls={panelId} aria-expanded={expanded} className="subject__toggle" onClick={onToggle} type="button"><span>{subject.name}</span><m.span animate={{ rotate: expanded ? 180 : 0 }} aria-hidden="true" className="subject__chevron" transition={{ duration: motionTokens.micro }}>⌄</m.span></button></h2><AnimatePresence initial={false}>{expanded && <m.div animate={{ height: 'auto', opacity: 1 }} className="subject__content" exit={{ height: 0, opacity: 0 }} id={panelId} initial={{ height: 0, opacity: 0 }} transition={{ duration: motionTokens.layout, ease: motionTokens.ease }}><TopicTree errors={errors} expandedIds={expandedTopicIds} masteredIds={masteredIds} onStatusChange={onStatusChange} onToggle={onTopicToggle} pendingIds={pendingIds} topics={subject.topics}/></m.div>}</AnimatePresence></section>;
}

export function SyllabusPage() {
  const [syllabus, setSyllabus] = useState<SyllabusData | null>(null), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState(false), [expanded, setExpanded] = useState<Set<string>>(new Set()), [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set()), [pendingIds, setPendingIds] = useState<Set<string>>(new Set()), [mutationErrors, setMutationErrors] = useState<Record<string,string>>({}), [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const load = useCallback(async () => { setLoading(true); setLoadError(false); try { setSyllabus(await getSyllabus()); } catch { setLoadError(true); setSyllabus(null); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const summary = useMemo(() => syllabus ? countSyllabusStatuses(syllabus) : null, [syllabus]);
  const changeStatus = async (topic: SyllabusTopic, status: TopicStatus) => {
    if (status === topic.status || pendingIds.has(topic.id) || topic.children.length > 0) return;
    setPendingIds((current) => new Set(current).add(topic.id));
    setMutationErrors((current) => { const next = { ...current }; delete next[topic.id]; return next; });
    try {
      const saved = await updateTopicStatus(topic.id, status);
      setSyllabus(await getSyllabus());
      if (saved.status === 'MASTERED') {
        setMasteredIds((current) => new Set(current).add(topic.id));
        window.setTimeout(() => setMasteredIds((current) => { const next = new Set(current); next.delete(topic.id); return next; }), 2200);
      }
    } catch { setMutationErrors((current) => ({ ...current, [topic.id]: 'Couldn’t update status. Try again.' })); }
    finally { setPendingIds((current) => { const next = new Set(current); next.delete(topic.id); return next; }); }
  };
  const toggleSet = (setter: Dispatch<SetStateAction<Set<string>>>, id: string) => setter((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return <section className="syllabus-page" aria-labelledby="syllabus-title"><header className="syllabus-header"><div><p className="eyebrow">LAST CHANCE · PROGRESS MAP</p><h1 id="syllabus-title">GATE 2027 Syllabus</h1><p>Open a subject, then expand only the topic branch you need.</p></div>{summary && <div className="syllabus-summary-card"><strong>{summary.counts.MASTERED}</strong><span>of {summary.total} actionable leaves mastered</span><div className="progress-track"><span style={{ width: `${Math.round(summary.counts.MASTERED / Math.max(1, summary.total) * 100)}%` }}/></div></div>}</header><DelayedPageSkeleton cards={4} label="Loading syllabus" pending={loading}/>{!loading && loadError && <div className="syllabus-state" role="alert"><p>Couldn’t load syllabus.</p><button className="retry-button" onClick={() => void load()} type="button">Retry</button></div>}{!loading && !loadError && syllabus && <><p className="syllabus-summary">{syllabus.subjectCount} subjects <span aria-hidden="true">·</span> {syllabus.officialTopicCount} official items <span aria-hidden="true">·</span> {syllabus.studySubtopicCount} study nodes <span aria-hidden="true">·</span> {syllabus.actionableLeafCount} actionable leaves</p>{syllabus.subjects.length === 0 ? <div className="empty-state"><h2>No syllabus data</h2><p>The official syllabus will appear here when available.</p></div> : <div className="subjects">{syllabus.subjects.map((subject) => <SubjectSection errors={mutationErrors} expanded={expanded.has(subject.id)} expandedTopicIds={expandedTopics} key={subject.id} masteredIds={masteredIds} onStatusChange={(topic,status) => void changeStatus(topic,status)} onToggle={() => toggleSet(setExpanded, subject.id)} onTopicToggle={(id) => toggleSet(setExpandedTopics, id)} pendingIds={pendingIds} subject={subject}/>)}</div>}</>}</section>;
}
