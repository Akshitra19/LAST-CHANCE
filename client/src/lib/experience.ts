export const motionTokens = {
  instant: 0.11,
  micro: 0.15,
  standard: 0.2,
  layout: 0.27,
  reveal: 0.36,
  signature: 1.05,
  stagger: 0.02,
  ease: [0.22, 1, 0.36, 1] as const
} as const;

export type PrimarySection = 'Home' | 'Plan' | 'Test' | 'Syllabus' | 'More';

export function primarySection(pathname: string): PrimarySection {
  if (pathname === '/') return 'Home';
  if (pathname.startsWith('/plan')) return 'Plan';
  if (pathname.startsWith('/syllabus')) return 'Syllabus';
  if (/^\/(test|tests|questions|results|mistakes)(\/|$)/.test(pathname)) return 'Test';
  return 'More';
}

export function shouldShowIntro(pathname: string, seen: boolean) {
  return !seen && pathname === '/';
}

const motivations = [
  'Small, deliberate wins become exam-day confidence.',
  'Clarity first. Then one focused block at a time.',
  'Practice the weak edge until it becomes familiar.',
  'Consistency is the quiet advantage you can build today.',
  'A reviewed mistake is progress you get to keep.',
  'Protect the next hour. Let the result follow.',
  'Today’s honest work is enough. Begin.'
] as const;

export function istDateKey(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function dailyMotivation(dateKey: string) {
  let hash = 0;
  for (const char of dateKey) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return motivations[hash % motivations.length];
}

export type CountdownFrame = 3 | 2 | 1 | 'BEGIN';
export const nextCountdownFrame = (frame: CountdownFrame): CountdownFrame | null =>
  frame === 3 ? 2 : frame === 2 ? 1 : frame === 1 ? 'BEGIN' : null;
