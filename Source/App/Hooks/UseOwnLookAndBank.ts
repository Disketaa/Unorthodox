import { useMemo } from 'preact/hooks';
import { GameConfig, PublicState } from '@/Game';
import { PlayerLook, ThemeId, themePool, themesForRoom } from '@/Core';
import { Session } from '../Session';
import { useOwnLook } from './UseOwnLook';
import { useSessionPhase } from './UseSessionPhase';

/** The player's own look as the host has it, and the bank this screen and the enchantment roll
 * both read. Out of the room's own pool and its code, so every screen holds the same six. */
export function useOwnLookAndBank(
  session: Session,
  phase: ReturnType<typeof useSessionPhase>,
  onLook: (look: PlayerLook) => void,
  roomCode: string,
  publicState: PublicState | undefined
): { ownLook: PlayerLook | undefined; bank: readonly ThemeId[] } {
  const ownLook = useOwnLook(session, phase.playerLooks, onLook);
  const bank = useMemo(
    () =>
      themesForRoom(
        roomCode,
        GameConfig.themes.cardsPerLobby,
        themePool(
          publicState?.themeMode ?? 'Random',
          publicState?.themes ?? [],
          session.getCustomThemes()
        )
      ),
    [roomCode, publicState?.themeMode, publicState?.themes, session, publicState]
  );
  return { ownLook, bank };
}
