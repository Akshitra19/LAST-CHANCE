import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/navigation/BottomNav';

export function MobileShell() {
  return (
    <div className="app-shell">
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
