import { AnimatePresence, m } from 'motion/react';
import { useEffect } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { BottomNav } from '../components/navigation/BottomNav';
import { Sidebar } from '../components/navigation/Sidebar';
import { motionTokens } from '../lib/experience';

export function MobileShell() {
  const location = useLocation();
  const outlet = useOutlet();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);
  return <div className="app-shell"><Sidebar/><main className="app-shell__content" id="main-content"><AnimatePresence initial={false} mode="sync"><m.div animate={{ opacity: 1, y: 0 }} className="route-stage" exit={{ opacity: 0, y: -3 }} initial={{ opacity: 0, y: 4 }} key={location.pathname} transition={{ duration: motionTokens.standard, ease: motionTokens.ease }}>{outlet}</m.div></AnimatePresence></main><BottomNav/></div>;
}
