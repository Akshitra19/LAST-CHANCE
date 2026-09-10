import { useEffect, useState } from 'react';

export function useDelayedPending(pending: boolean, delay = 160) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!pending) { setVisible(false); return; }
    const timer = window.setTimeout(() => setVisible(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay, pending]);
  return visible;
}

export function InlineSpinner({ label = 'Loading' }: { label?: string }) {
  return <span className="inline-spinner" role="status"><span aria-hidden="true"/>{label}</span>;
}

export function PageSkeleton({ label = 'Loading page', cards = 3 }: { label?: string; cards?: number }) {
  return <div aria-busy="true" className="loading-shell" role="status"><span className="sr-only">{label}</span>{Array.from({ length: cards }, (_, index) => <div aria-hidden="true" className="card-skeleton" key={index}><span/><span/><span/></div>)}</div>;
}

export function DelayedPageSkeleton(props: { pending: boolean; label?: string; cards?: number }) {
  const visible = useDelayedPending(props.pending);
  return <>{props.pending && <span className="sr-only" role="status">{props.label ?? 'Loading page'}</span>}{visible && <PageSkeleton cards={props.cards} label={props.label}/>}</>;
}
