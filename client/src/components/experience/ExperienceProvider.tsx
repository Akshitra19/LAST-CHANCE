import { LazyMotion, MotionConfig, domAnimation, m, useReducedMotionConfig } from 'motion/react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { motionTokens, shouldShowIntro } from '../../lib/experience';

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type ExperienceValue = { installAvailable: boolean; install: () => Promise<void>; setDirty: (key: string, dirty: boolean) => void };
const ExperienceContext = createContext<ExperienceValue>({ installAvailable: false, install: async () => undefined, setDirty: () => undefined });

export const useExperience = () => useContext(ExperienceContext);
export function useUnsavedChanges(key: string, dirty: boolean) {
  const { setDirty } = useExperience();
  useEffect(() => { setDirty(key, dirty); return () => setDirty(key, false); }, [dirty, key, setDirty]);
}

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [experienceHarness] = useState(() => import.meta.env.DEV ? new URLSearchParams(window.location.search).get('experience') : null);
  const forceReducedMotion = experienceHarness === 'reduced-motion';
  const forceTextZoom = experienceHarness === 'text-zoom-200';
  const [offline, setOffline] = useState(() => experienceHarness === 'offline' || !navigator.onLine);
  const [backOnline, setBackOnline] = useState(false);
  const [updateReady, setUpdateReady] = useState(() => experienceHarness === 'update');
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const dirtyKeys = useRef(new Set<string>());
  const [dirtyCount, setDirtyCount] = useState(0);
  const updateRef = useRef<(reload?: boolean) => Promise<void>>(async () => undefined);
  useEffect(() => {
    updateRef.current = registerSW({ immediate: true, onNeedRefresh: () => setUpdateReady(true) });
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('v1-12-reduced-motion-test', forceReducedMotion);
    return () => document.documentElement.classList.remove('v1-12-reduced-motion-test');
  }, [forceReducedMotion]);
  useEffect(() => {
    document.documentElement.classList.toggle('v1-12-text-zoom-test', forceTextZoom);
    return () => document.documentElement.classList.remove('v1-12-text-zoom-test');
  }, [forceTextZoom]);
  useEffect(() => {
    const onOffline = () => { setOffline(true); setBackOnline(false); };
    const onOnline = () => { setOffline(false); setBackOnline(true); window.setTimeout(() => setBackOnline(false), 2600); };
    const onInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('offline', onOffline); window.addEventListener('online', onOnline); window.addEventListener('beforeinstallprompt', onInstall);
    return () => { window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline); window.removeEventListener('beforeinstallprompt', onInstall); };
  }, []);
  const setDirty = useCallback((key: string, dirty: boolean) => { dirty ? dirtyKeys.current.add(key) : dirtyKeys.current.delete(key); setDirtyCount(dirtyKeys.current.size); }, []);
  const install = useCallback(async () => { if (!installPrompt) return; await installPrompt.prompt(); await installPrompt.userChoice; setInstallPrompt(null); }, [installPrompt]);
  const activeAttempt = pathname.startsWith('/attempts/');
  const value = useMemo(() => ({ installAvailable: Boolean(installPrompt), install, setDirty }), [installPrompt, install, setDirty]);
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion={forceReducedMotion ? 'always' : 'user'}><ExperienceContext.Provider value={value}>
    {children}<AppIntro pathname={pathname}/>
    <div aria-live="polite" className="experience-notices">
      {offline && <p className="network-banner network-banner--offline" role="status">You’re offline. Saved server data may be unavailable.</p>}
      {backOnline && <p className="network-banner" role="status">Back online.</p>}
      {updateReady && !activeAttempt && <div className="update-banner" role="status"><span>{dirtyCount ? 'Update ready. Save or discard edits before updating.' : 'A safe app update is ready.'}</span><button disabled={dirtyCount > 0} onClick={() => void updateRef.current(true)} type="button">Update now</button><button onClick={() => setUpdateReady(false)} type="button">Later</button></div>}
    </div>
  </ExperienceContext.Provider></MotionConfig></LazyMotion>;
}

function AppIntro({ pathname }: { pathname: string }) {
  const reduced = useReducedMotionConfig();
  const [open, setOpen] = useState(() => {
    try { return shouldShowIntro(pathname, sessionStorage.getItem('last-chance:intro') === 'seen'); } catch { return pathname === '/'; }
  });
  const close = useCallback(() => { try { sessionStorage.setItem('last-chance:intro', 'seen'); } catch { /* private storage may be unavailable */ } setOpen(false); }, []);
  useEffect(() => { if (!open) return; const timer = window.setTimeout(close, reduced ? 120 : 1050); return () => window.clearTimeout(timer); }, [close, open, reduced]);
  useEffect(() => { if (pathname !== '/' && open) close(); }, [close, open, pathname]);
  useEffect(() => { if (!open) return; const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' || event.key === 'Enter') close(); }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, [close, open]);
  if (!open) return null;
  return <m.div animate={{ opacity: 1 }} aria-label="Opening LAST CHANCE" aria-modal="true" className="app-intro" exit={{ opacity: 0 }} initial={{ opacity: 0 }} role="dialog" transition={{ duration: reduced ? motionTokens.instant : motionTokens.reveal }}><m.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: reduced ? 0 : 10 }} transition={{ duration: reduced ? motionTokens.instant : motionTokens.layout, ease: motionTokens.ease }}><span>LAST</span><strong>CHANCE</strong><i aria-hidden="true" className="app-intro__line"/><small>GATE 2027 · CS</small><em>Make today count.</em></m.div><button autoFocus onClick={close} type="button">Skip</button></m.div>;
}
