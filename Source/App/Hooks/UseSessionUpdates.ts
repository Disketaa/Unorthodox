import { useEffect } from 'preact/hooks';
import { Session } from '../Session';

/** Keep the component rendering when the session has news. The session is a plain object with no
 * state of its own, so a re-render is what makes new public state visible; the cleanup stops
 * the session, tearing the transport down. */
export function useSessionUpdates(
  session: Session,
  setVersion: (update: (version: number) => number) => void,
  setHostLeft: (value: boolean) => void
): void {
  useEffect(() => {
    session.onUpdate(() => setVersion((version) => version + 1));
    session.onHostLeave(() => setHostLeft(true));
    return () => session.stop();
  }, [session]);
}
