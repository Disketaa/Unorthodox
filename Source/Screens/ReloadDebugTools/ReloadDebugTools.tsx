import { IconButton } from '@/Design/Components';
import { PublicState } from '@/Game';
import { Strings } from '@/Content';

export interface ReloadDebugToolsProps {
  publicState: PublicState | undefined;
  onReloadPhase: () => void;
}

/** The phase the room is in begun again from its first second, so a host can watch a reveal or a
 * count twice without the room rewriting or revoting anything. Out in the lobby, which has no
 * clock to set back and nothing to watch a second time. */
export function ReloadDebugTools({ publicState, onReloadPhase }: ReloadDebugToolsProps) {
  if (publicState === undefined || publicState.phase === 'Lobby') {
    return null;
  }
  return <IconButton icon="Reload" label={Strings.turn.reloadPhase} onClick={onReloadPhase} />;
}
