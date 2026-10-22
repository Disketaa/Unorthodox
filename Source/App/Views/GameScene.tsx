import type { ComponentChildren } from 'preact';
import { Stack } from '@/Design/Primitives';
import { PhaseInfoView } from './PhaseInfoView';
import { PlayerBarView } from './PlayerBarView';
import { QuestionOverlay } from './QuestionOverlay';
import { ThemeCardsView, spentByTheme } from './ThemeCardsView';
import { LeaderboardView } from './LeaderboardView';
import { WinningView } from './WinningView';
import { ReviewView } from './ReviewView';
import { WritingView } from './WritingView';
import type { PhaseViewProps } from './LobbyView';

/** The stage the game plays on: what the room is doing at the very top, the room's hexes under
 * it, and the themes below. The row of players is off where the stage is the room itself, since
 * the leaderboard is a row of players drawn differently. */
export function GameScene({
  view,
  children,
  bar = true,
}: PhaseViewProps & { children?: ComponentChildren; bar?: boolean }) {
  const choosing = view.publicState?.phase === 'Choosing' ? view.publicState : undefined;
  // The bank leaves once the question is on screen. It was never going to be answered then, and it
  // takes the whole window, which is the one place the question has to be read.
  const bankOpen = view.phase === 'Choosing' && choosing?.question === undefined;
  // Stretch rather than centre, so a phase may lay itself out across the whole stage: the note
  // and the bar above centre their own contents, and a centred flex item is sized to what is in
  // it, which for a row of cards is cards measuring themselves against the cards beside them.
  return (
    <Stack align="Stretch" gap="Md" grow clip>
      <Stack gap="Md" align="Center">
        <PhaseInfoView view={view} />
        {bar && <PlayerBarView view={view} />}
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
          themeMode={view.publicState?.themeMode ?? 'Random'}
          enabledThemes={view.publicState?.themes ?? []}
          customThemes={view.publicState?.customThemes ?? []}
          pace={view.publicState?.pace ?? 'Standard'}
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

/** Reviewing: the stage with the board of answers under it, taking the room the stage leaves so
 * nine of them fill it rather than scroll half the round below the fold. The last stretch of
 * the scores phase shows where the room stands instead of the board it has just read. */
export function ReviewScene({ view }: PhaseViewProps) {
  return (
    <GameScene view={view}>
      <ReviewView view={view} />
    </GameScene>
  );
}

/** Leaderboard: the stage with the room's places under it, which is what the room is shown once
 * the round has been counted. The bar of players is off, since the places are a row of the same
 * people and the figures stand on the lines. */
export function LeaderboardScene({ view }: PhaseViewProps) {
  return (
    <GameScene view={view} bar={false}>
      <LeaderboardView view={view} />
    </GameScene>
  );
}

/** Winning: the stage with the show on it, which is what the room is shown once the game is
 * over: the bank taken away and the winner left standing in it. */
export function WinningScene({ view }: PhaseViewProps) {
  return (
    <GameScene view={view} bar={false}>
      <WinningView view={view} />
    </GameScene>
  );
}


