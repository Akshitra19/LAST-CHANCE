import { NavLink } from 'react-router-dom';

const navigationItems = [
  { label: 'Home', to: '/', end: true },
  { label: 'Plan', to: '/plan', end: false },
  { label: 'Test', to: '/test', end: false },
  { label: 'Syllabus', to: '/syllabus', end: false },
  { label: 'More', to: '/more', end: false }
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav__inner">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              isActive ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'
            }
            end={item.end}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
