import { AnimatePresence, m } from 'motion/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { motionTokens } from '../../lib/experience';

export function Dialog({ open, titleId, onClose, children, busy = false }: { open: boolean; titleId: string; onClose: () => void; children: ReactNode; busy?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  if (open && !wasOpenRef.current) returnRef.current = document.activeElement as HTMLElement | null;
  wasOpenRef.current = open;
  onCloseRef.current = onClose;
  busyRef.current = busy;
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('[autofocus],button,input,select,textarea,a[href]')?.focus(), 0);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')];
      if (!nodes.length) return;
      const first = nodes[0]!, last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(timer); document.body.style.overflow = prior; document.removeEventListener('keydown', onKey); returnRef.current?.focus(); };
  }, [open]);
  return <AnimatePresence>{open && <m.div animate={{ opacity: 1 }} className="confirm-backdrop" exit={{ opacity: 0 }} initial={{ opacity: 0 }} transition={{ duration: motionTokens.micro }}><m.div animate={{ opacity: 1, scale: 1 }} aria-labelledby={titleId} aria-modal="true" className="confirm-dialog" exit={{ opacity: 0, scale: .98 }} initial={{ opacity: 0, scale: .98 }} ref={dialogRef} role="dialog" transition={{ duration: motionTokens.standard, ease: motionTokens.ease }}>{children}</m.div></m.div>}</AnimatePresence>;
}
