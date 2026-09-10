import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import type { AnalyticsResponse, MistakeCategory } from '../../types/analytics';
import { outcomeColors } from '../../types/analytics';

const palette = ['#314f91', '#2f855a', '#b7791f', '#9f3f73', '#5f6caf', '#167d8d', '#8c4a3f', '#7b8794'];
const mistakeLabels: Record<MistakeCategory, string> = { CONCEPT_GAP: 'Concept Gap', FORMULA_FORGOTTEN: 'Formula Forgotten', CALCULATION: 'Calculation', MISREAD: 'Misread', GUESS: 'Guess', TIME_PRESSURE: 'Time Pressure', RECALL_FAILURE: 'Recall Failure', UNCLASSIFIED: 'Unclassified' };
const syllabusLabels: Record<AnalyticsResponse['syllabusProgress']['items'][number]['status'], string> = { NOT_STARTED: 'Not Started', LEARNING: 'Learning', PRACTICING: 'Practicing', PYQ: 'PYQ', REVISING: 'Revising', MASTERED: 'Mastered', WEAK: 'Weak' };
const pct = (value: number | null) => value === null ? 'No data' : `${value.toFixed(2)}%`;
const duration = (seconds: number) => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
const dateTime = (value: string) => new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));

function ChartCard({ id, title, description, empty, emptyText, children, summary }: { id: string; title: string; description: string; empty: boolean; emptyText: string; children: React.ReactNode; summary: React.ReactNode }) {
  return <section aria-labelledby={id} className="analytics-chart-card"><header><h2 id={id}>{title}</h2><p>{description}</p></header>{empty ? <p className="analytics-empty">{emptyText}</p> : <>{children}{summary}</>}</section>;
}

export function PerformanceChart({ data, target }: { data: AnalyticsResponse['performanceTrend']; target: number | null }) {
  const chart = data.map((item) => ({ ...item, label: new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(new Date(item.submittedAt)) }));
  return <ChartCard id="performance-title" title="Test Performance" description="Score and attempted-question accuracy for each submitted test, in chronological order." empty={!data.length} emptyText="Complete a test to start seeing your performance trend." summary={<ol className="analytics-data-list">{data.map((item) => <li key={item.attemptId}><Link to={`/results/${item.attemptId}`}>{item.testName}</Link><span>{dateTime(item.submittedAt)} · Score {pct(item.scorePercent)} · Accuracy {pct(item.accuracyPercent)} · {item.score.toFixed(2)}/{item.totalMarks.toFixed(2)}</span></li>)}</ol>}>
    <div className="analytics-chart analytics-chart--line"><ResponsiveContainer height="100%" width="100%"><LineChart accessibilityLayer data={chart} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label" minTickGap={18}/><YAxis unit="%"/><Tooltip/><Legend/>{target !== null && <ReferenceLine label="Target" stroke="#b7791f" strokeDasharray="5 5" y={target}/>}<Line dataKey="scorePercent" name="Score %" stroke="#314f91" strokeWidth={3}/><Line dataKey="accuracyPercent" name="Accuracy %" stroke="#2f855a" strokeWidth={3}/></LineChart></ResponsiveContainer></div>
  </ChartCard>;
}

export function OutcomesChart({ data }: { data: AnalyticsResponse['outcomes'] }) {
  const items = [{ name: 'Correct', value: data.correctCount, color: outcomeColors.CORRECT }, { name: 'Wrong', value: data.wrongCount, color: outcomeColors.WRONG }, { name: 'Skipped', value: data.skippedCount, color: outcomeColors.SKIPPED }];
  return <ChartCard id="outcomes-title" title="Question Outcomes" description="Accuracy uses attempted questions only; skipped questions remain outside its denominator." empty={data.questionCount === 0} emptyText="Complete a test to see question outcomes." summary={<dl className="analytics-inline-facts">{items.map((item) => <div key={item.name}><dt>{item.name}</dt><dd>{item.value}</dd></div>)}<div><dt>Attempted</dt><dd>{data.attemptedCount}</dd></div><div><dt>Total</dt><dd>{data.questionCount}</dd></div><div><dt>Accuracy</dt><dd>{pct(data.accuracyPercent)}</dd></div></dl>}>
    <div className="analytics-chart analytics-chart--donut"><ResponsiveContainer height="100%" width="100%"><PieChart accessibilityLayer><Pie data={items} dataKey="value" innerRadius="52%" nameKey="name" outerRadius="78%" paddingAngle={2}>{items.map((item) => <Cell fill={item.color} key={item.name}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
  </ChartCard>;
}

export function SubjectChart({ data }: { data: AnalyticsResponse['subjectPerformance'] }) {
  const chart = data.map((item) => ({ ...item, chartAccuracy: item.accuracyPercent ?? 0 }));
  return <ChartCard id="subjects-title" title="Subject Performance" description="Accuracy is Correct ÷ Attempted. Average time includes every reviewed question, including skipped ones." empty={!data.length} emptyText="No subject history is available for these filters." summary={<ul className="analytics-data-list">{data.map((item) => <li key={item.subjectId}><strong>{item.subjectName}</strong><span>{item.attemptedCount ? `${pct(item.accuracyPercent)} accuracy` : 'No attempted questions'} · {item.correctCount} correct · {item.wrongCount} wrong · {item.skippedCount} skipped · {duration(item.averageTimePerQuestionSeconds)}</span></li>)}</ul>}>
    <div className="analytics-chart analytics-chart--subjects"><ResponsiveContainer height="100%" width="100%"><BarChart accessibilityLayer data={chart} layout="vertical" margin={{ top: 4, right: 22, bottom: 4, left: 14 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" unit="%"/><YAxis dataKey="subjectName" type="category" width={128}/><Tooltip/><Bar dataKey="chartAccuracy" fill="#314f91" name="Accuracy %" radius={[0, 6, 6, 0]}/></BarChart></ResponsiveContainer></div>
  </ChartCard>;
}

export function StudyChart({ data, planned, actual, adherence }: { data: AnalyticsResponse['studyTrend']; planned: number; actual: number; adherence: number | null }) {
  const hasStudy = planned > 0 || actual > 0;
  return <ChartCard id="study-title" title="Study Consistency" description="Planner totals use India calendar dates. Missing actual time contributes no invented study time." empty={!hasStudy} emptyText="Track study time in Planner to see your study consistency." summary={<dl className="analytics-inline-facts"><div><dt>Planned</dt><dd>{planned} min</dd></div><div><dt>Actual</dt><dd>{actual} min</dd></div><div><dt>Adherence</dt><dd>{pct(adherence)}</dd></div></dl>}>
    <div className="analytics-chart analytics-chart--line"><ResponsiveContainer height="100%" width="100%"><LineChart accessibilityLayer data={data} margin={{ top: 12, right: 12, bottom: 8, left: -12 }}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label" minTickGap={20}/><YAxis unit="m"/><Tooltip/><Legend/><Line dataKey="plannedMinutes" name="Planned study" stroke="#314f91" strokeWidth={3}/><Line dataKey="actualMinutes" name="Actual study" stroke="#2f855a" strokeWidth={3}/></LineChart></ResponsiveContainer></div>
  </ChartCard>;
}

export function MistakeChart({ data }: { data: AnalyticsResponse['mistakeBreakdown'] }) {
  const chart = data.items.map((item, index) => ({ ...item, label: mistakeLabels[item.category], fill: palette[index] }));
  return <ChartCard id="mistakes-analytics-title" title="Why Am I Losing Marks?" description="Wrong and skipped answer rows are counted; unclassified history remains visible." empty={data.total === 0} emptyText="Wrong and skipped questions will appear here after you complete tests." summary={<><dl className="analytics-inline-facts"><div><dt>Total mistakes</dt><dd>{data.total}</dd></div><div><dt>Classified</dt><dd>{data.classified}</dd></div><div><dt>Unclassified</dt><dd>{data.unclassified}</dd></div><div><dt>Classification rate</dt><dd>{pct(data.classificationRatePercent)}</dd></div></dl><ul className="analytics-legend-list">{chart.map((item) => <li key={item.category}><span aria-hidden="true" style={{ background: item.fill }}/><strong>{item.label}</strong><span>{item.count}</span></li>)}</ul></>}>
    <div className="analytics-chart analytics-chart--bars"><ResponsiveContainer height="100%" width="100%"><BarChart accessibilityLayer data={chart} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 12 }}><CartesianGrid strokeDasharray="3 3"/><XAxis allowDecimals={false} type="number"/><YAxis dataKey="label" type="category" width={128}/><Tooltip/><Bar dataKey="count" name="Entries" radius={[0, 6, 6, 0]}>{chart.map((item) => <Cell fill={item.fill} key={item.category}/>)}</Bar></BarChart></ResponsiveContainer></div>
  </ChartCard>;
}

export function SyllabusChart({ data }: { data: AnalyticsResponse['syllabusProgress'] }) {
  const chart = data.items.map((item, index) => ({ ...item, label: syllabusLabels[item.status], fill: palette[index] }));
  return <ChartCard id="syllabus-analytics-title" title="Syllabus Progress" description="A current snapshot of all official topics. Date and test-type filters do not change it." empty={data.totalTopics === 0} emptyText="Syllabus progress is unavailable." summary={<ul className="analytics-legend-list">{chart.map((item) => <li key={item.status}><span aria-hidden="true" style={{ background: item.fill }}/><strong>{item.label}</strong><span>{item.count} · {pct(item.percentage)}</span></li>)}</ul>}>
    <div className="analytics-chart analytics-chart--bars"><ResponsiveContainer height="100%" width="100%"><BarChart accessibilityLayer data={chart} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 12 }}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number"/><YAxis dataKey="label" type="category" width={106}/><Tooltip/><Bar dataKey="count" name="Topics" radius={[0, 6, 6, 0]}>{chart.map((item) => <Cell fill={item.fill} key={item.status}/>)}</Bar></BarChart></ResponsiveContainer></div>
  </ChartCard>;
}
