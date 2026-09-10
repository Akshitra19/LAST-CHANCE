import type { PrimarySection } from '../../lib/experience';

export function NavIcon({ name }: { name: PrimarySection }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 };
  return <svg aria-hidden="true" className="nav-icon" viewBox="0 0 24 24">
    {name === 'Home' && <><path {...common} d="m3 11 9-8 9 8"/><path {...common} d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>}
    {name === 'Plan' && <><rect {...common} height="17" rx="2" width="16" x="4" y="4"/><path {...common} d="M8 2v4m8-4v4M7.5 10h9m-9 4h4m-4 4h7"/></>}
    {name === 'Test' && <><path {...common} d="M7 3h10v4H7zM6 5H4v16h16V5h-2"/><path {...common} d="m8 13 2 2 5-5m-7 9h8"/></>}
    {name === 'Syllabus' && <><path {...common} d="M4 4.5C7 3.5 9.5 4 12 6v15c-2.5-2-5-2.5-8-1.5zM20 4.5c-3-1-5.5-.5-8 1.5v15c2.5-2 5-2.5 8-1.5z"/></>}
    {name === 'More' && <><circle {...common} cx="5" cy="12" r="1.2"/><circle {...common} cx="12" cy="12" r="1.2"/><circle {...common} cx="19" cy="12" r="1.2"/></>}
  </svg>;
}
