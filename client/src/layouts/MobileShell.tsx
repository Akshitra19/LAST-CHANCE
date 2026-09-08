import { Outlet } from 'react-router-dom';
import { BottomNav } from '../components/navigation/BottomNav';
import { Sidebar } from '../components/navigation/Sidebar';

export function MobileShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-shell__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
