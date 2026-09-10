import type { AnalyticsRange, AnalyticsTestType } from '../../types/analytics';

export function AnalyticsFilters({ range, testType, disabled, onRange, onTestType }: { range: AnalyticsRange; testType: AnalyticsTestType; disabled: boolean; onRange: (value: AnalyticsRange) => void; onTestType: (value: AnalyticsTestType) => void }) {
  return <section aria-label="Analytics filters" className="analytics-filters">
    <label>Date range<select disabled={disabled} onChange={(event) => onRange(event.target.value as AnalyticsRange)} value={range}><option value="7D">7 Days</option><option value="30D">30 Days</option><option value="90D">90 Days</option><option value="ALL">All</option></select></label>
    <label>Test type<select disabled={disabled} onChange={(event) => onTestType(event.target.value as AnalyticsTestType)} value={testType}><option value="ALL">All Tests</option><option value="TOPIC">Topic</option><option value="CUSTOM">Custom</option><option value="FULL_MOCK">Full Mock</option></select></label>
    <p>Test type filters test performance, outcomes, subjects, mistakes, and type summaries. Study consistency and syllabus progress stay independent.</p>
  </section>;
}
