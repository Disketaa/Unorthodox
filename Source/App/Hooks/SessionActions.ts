import { PlayerId, CustomTheme } from '@/Core';
import { Session } from '../Session';

/** Actions that delegate to the session: kick, set custom themes, remove a custom theme. */
export function sessionActions(session: Session) {
  return {
    kickPlayer: (playerId: PlayerId) => session.kick(playerId),
    setCustomThemes: (themes: readonly CustomTheme[]) => session.setCustomThemes?.(themes),
    removeCustomTheme: (name: string) => session.removeCustomTheme?.(name),
  };
}
