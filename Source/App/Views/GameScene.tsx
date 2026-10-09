import type { ComponentChildren } from 'preact';
import { ThemeId } from '@/Core';
import { Stack } from '@/Design/Primitives';
import type { GameSessionView } from '../Hooks/UseGameSession';
import { PhaseInfoView } from './PhaseInfoView';
import { PlayerBarView } from './PlayerBarView';
import { QuestionOverlay } from './QuestionOverlay';
import { ThemeCardsView } from './ThemeCardsView';
import { WritingView } from './WritingView';
import type { PhaseViewProps } from './LobbyView';

/** The stage the game plays on: what the room is doing at the very top, the room's hexes under
 * it, and the themes below. The bank sits under the note rather than in the middle of what is
 * left: it was measured against the viewport, so it moved as the note above it changed height. */
export function GameScene({
  view,
  children,
}: PhaseViewProps & { children?: ComponentChildren }) {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The bank leaves once the question is on screen. It was never going to be answered then, and it
  // takes the whole window, which is the one place the question has to be read.
  const bankOpen = view.phase === 'Choosing' && choosing?.question === undefined;
  return (
    <Stack align="Center" gap="Md" grow clip>
      <Stack gap="Md" align="Center">
        <PhaseInfoView view={view} />
        <PlayerBarView view={view} />
      </Stack>
      {bankOpen && (
        <ThemeCardsView
          roomCode={view.roomCode}
          choosing
          myTurn={view.playerId !== null && view.playerId === view.turnPlayerId}
          theme={view.publicState?.phase === 'Lobby' ? undefined : view.publicState?.theme}
          picking={choosing?.picking}
          clockOffsetMs={view.clockOffsetMs}
          onPickTheme={view.chooseTheme}
          spent={spentByTheme(view.publicState)}
        />
      )}
      {!bankOpen && <QuestionOverlay view={view} />}
      {children}
    </Stack>
  );
}

/** Writing: the stage with the answer field under it, so the bar and the draft are read as one
 * screen rather than as the room waiting behind a form. */
export function WritingScene({ view }: PhaseViewProps) {
  return (
    <GameScene view={view}>
      <WritingView view={view} />
    </GameScene>
  );
}

/** The room's per-theme round counts as the map the cards read, built here because the state
 * arrives as the pairs it went out as. Nothing counted is an empty map rather than a full one,
 * so a room that has not played a round draws a bank of full bars. */
function spentByTheme(state: GameSessionView['publicState']): Map<ThemeId, number> | undefined {
  if (state === undefined) {
    return undefined;
  }
  return new Map(state.spent.map(({ theme, rounds }) => [theme, rounds]));
}
