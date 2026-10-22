import { useEffect, useRef, useState } from 'preact/hooks';
import { playSound } from '@/Design/Sounds';
import { playMusic, useQuietMusic } from '@/Design/Music';
import { GameConfig, bankSize, bankThemes } from '@/Game';
import { ThemeCardsView, spentByTheme } from './ThemeCardsView';
import { WinnerPanel } from './WinnerPanel';
import { winnerOf } from './GameOver';
import type { PhaseViewProps } from './LobbyView';
import styles from './WinningView.module.css';

/** The room's own clock, which is the show's as well: the cards leave on the room's time and the
 * winner stands in the time the room has left. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** What the show has done so far: the cards that are off the board, the one on its way out, and
 * whether the winner has had their turn yet. */
interface Show {
  gone: Set<string>;
  leaving: string | undefined;
  shown: boolean;
}

/** The cards are gone one at a time: the first that has had its beat is off the board, and the
 * one after it is on its way. The winner stands once the bank is empty and its stage has been
 * held for a beat, so the last card is seen leaving before the player arrives. */
function showAt(
  elapsed: number,
  cards: number,
  beat: number,
  lead: number,
  reveal: number,
  themes: readonly string[]
): Show {
  const since = elapsed - lead;
  const started = since >= 0;
  const taken = started ? Math.min(cards, Math.floor(since / beat)) : 0;
  return {
    gone: new Set(themes.slice(0, taken)),
    leaving: started && taken < cards ? themes[taken] : undefined,
    shown: elapsed >= lead + cards * beat + reveal,
  };
}

/** The show: the room's bank taken away one card at a time, and then the player who won the game
 * left standing in the middle of it. The cards leave on the room's own clock, so every screen
 * in the room empties the same bank at the same moment. */
function useWinningSounds(show: Show, hasWinner: boolean) {
  const [quiet, setQuiet] = useState(true);
  useQuietMusic(quiet);
  useEffect(() => {
    if (show.shown && hasWinner) {
      setQuiet(false);
      playSound('Confetti');
      playMusic('Winner', GameConfig.timing.winningHoldMs / 1000, false);
    }
  }, [show.shown, hasWinner]);
  const sounding = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (show.leaving === sounding.current) return;
    sounding.current = show.leaving;
    if (show.leaving !== undefined) playSound('Break');
  }, [show.leaving]);
  return quiet;
}

function useWinningShow(view: PhaseViewProps['view']) {
  const state = view.publicState?.phase === 'Winning' ? view.publicState : undefined;
  const themes = bankThemes(
    view.roomCode,
    state?.themeMode ?? 'Random',
    state?.themes ?? [],
    state?.customThemes ?? []
  );
  const cards = bankSize({
    themeMode: state?.themeMode ?? 'Random',
    themes: state?.themes ?? [],
    customThemes: state?.customThemes ?? [],
  });
  const now = useNow(state !== undefined && view.paused !== true);
  const moment = view.paused && view.pausedAt !== undefined ? view.pausedAt : now;
  const elapsed = Math.max(0, moment - view.phaseStartedAt);
  const timing = GameConfig.timing;
  const show = showAt(
    elapsed,
    cards,
    timing.winningCardMs,
    timing.winningLeadInMs,
    timing.winningRevealMs,
    themes
  );
  const winner = winnerOf(state?.scores ?? []);
  const hasWinner = winner !== undefined;
  useWinningSounds(show, hasWinner);
  return { state, show, winner };
}

export function WinningView({ view }: PhaseViewProps) {
  const { state, show, winner } = useWinningShow(view);
  return (
    <div class={`${styles.Root} ${view.paused ? styles.Paused : ''}`}>
      <ThemeCardsView
        roomCode={view.roomCode}
        choosing={false}
        myTurn={false}
        theme={undefined}
        picking={undefined}
        clockOffsetMs={view.clockOffsetMs}
        onPickTheme={() => {}}
        spent={spentByTheme(state)}
        enchant={false}
        themeMode={state?.themeMode ?? 'Random'}
        enabledThemes={state?.themes ?? []}
        customThemes={state?.customThemes ?? []}
        pace={state?.pace ?? 'Standard'}
        gone={show.gone}
        leaving={show.leaving}
      />
      {show.shown && <WinnerPanel view={view} winner={winner} paused={view.paused} />}
    </div>
  );
}
