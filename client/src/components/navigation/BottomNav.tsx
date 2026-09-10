import { Link, useLocation } from 'react-router-dom';
import { primarySection } from '../../lib/experience';
import { NavIcon } from './NavIcon';
import { navigationItems } from './navigation-items';

export function BottomNav() {
  const activeSection = primarySection(useLocation().pathname);
  return <nav className="bottom-nav" aria-label="Primary navigation"><div className="bottom-nav__inner">{navigationItems.map((item) => <Link aria-current={activeSection === item.label ? 'page' : undefined} className={activeSection === item.label ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'} key={item.to} to={item.to}><NavIcon name={item.label}/><span>{item.label}</span></Link>)}</div></nav>;
}
