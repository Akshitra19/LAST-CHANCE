import { NavLink } from 'react-router-dom';
import { navigationItems } from './navigation-items';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand"><span>LAST</span> CHANCE</div>
      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navigationItems.map((item) => (
          <NavLink className={({ isActive }) => isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link'} end={item.end} key={item.to} to={item.to}>{item.label}</NavLink>
        ))}
      </nav>
      <p className="sidebar__meta">GATE 2027 · CS</p>
    </aside>
  );
}
