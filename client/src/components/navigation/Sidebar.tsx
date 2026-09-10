import { Link, useLocation } from 'react-router-dom';
import { primarySection } from '../../lib/experience';
import { NavIcon } from './NavIcon';
import { navigationItems } from './navigation-items';

export function Sidebar() {
  const activeSection = primarySection(useLocation().pathname);
  return <aside className="sidebar"><div className="sidebar__brand"><span>LAST</span> CHANCE</div><nav className="sidebar__nav" aria-label="Primary navigation">{navigationItems.map((item) => <Link aria-current={activeSection === item.label ? 'page' : undefined} className={activeSection === item.label ? 'sidebar__link sidebar__link--active' : 'sidebar__link'} key={item.to} to={item.to}><NavIcon name={item.label}/><span>{item.label}</span></Link>)}</nav><p className="sidebar__meta">GATE 2027 · CS</p></aside>;
}
