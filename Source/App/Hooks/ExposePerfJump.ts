import { Session } from '../Session';

/** Let the performance run step the room into a hidden phase, such as the winning show, through
 * the host's console jump. Off unless the perf sink is installed, and the host owns the jump. */
export function exposePerfJump(session: Session): void {
  if (!import.meta.env.DEV || window.__perf === undefined) return;
  window.__perfJump = (phase: string) => {
    if (phase === 'Leaderboard') {
      session.finish();
    } else {
      session.nextPhase('');
    }
  };
}
