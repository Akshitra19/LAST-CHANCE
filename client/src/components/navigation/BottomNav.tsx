import { NavLink, useLocation } from 'react-router-dom';
import { navigationItems } from './navigation-items';

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav__inner">
        {navigationItems.map((item) => (
          <NavLink
            aria-current={item.label === 'Test' && pathname.startsWith('/questions') ? 'page' : undefined}
            className={({ isActive }) => isActive || item.label === 'Test' && pathname.startsWith('/questions') ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'}
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
