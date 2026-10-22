import { useEffect, useState } from 'preact/hooks';
import { Character } from '@/Design/Components';
import { lookFor } from '@/Screens';
import { bankSize, bankThemes } from '@/Game';
import { ThemeCardsView } from './ThemeCardsView';
import type { PhaseViewProps } from './LobbyView';
import type { GameSessionView } from '../Hooks/GameSessionView';
import styles from './WinningView.module.css';

/** How long the show waits between one card leaving and the next, read from the page rather than
 * imported: the design may not read Game, and `GameConfig.timing` holds the same number for the
 * code that opens the phase. */
const CardToken = '--Duration-WinningCard';

/** What the beat falls back to where the page has not declared the token. */
const FallbackCardMs = 700;

function cardMs(): number {
  const declared = getComputedStyle(document.documentElement).getPropertyValue(CardToken);
  const value = Number.parseFloat(declared);
  return Number.isFinite(value) && value > 0 ? value : FallbackCardMs;
}

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

/** The room's winner: the highest total, and the first of them where two are level, so every
 * screen in the room names the same player. */
function winnerOf(
  scores: readonly { id: string; score: number }[]
): { id: string; score: number } | undefined {
  let best: { id: string; score: number } | undefined;
  for (const entry of scores) {
    if (best === undefined || entry.score > best.score) best = entry;
  }
  return best;
}

/** What the show has done so far: the cards that are off the board, the one on its way out, and
 * whether the winner has had their turn yet. */
interface Show {
  gone: Set<string>;
  leaving: string | undefined;
  shown: boolean;
}

/** The cards are gone one at a time: the first that has had its beat is off the board, and the
 * one after it is on its way. The winner stands once the bank is empty. */
function showAt(elapsed: number, cards: number, beat: number, themes: readonly string[]): Show {
  const taken = Math.min(cards, Math.floor(elapsed / beat));
  return {
    gone: new Set(themes.slice(0, taken)),
    leaving: taken < cards ? themes[taken] : undefined,
    shown: elapsed >= cards * beat,
  };
}

/** The show: the room's bank taken away one card at a time, and then the player who won the game
 * left standing in the middle of it. The cards leave on the room's own clock, so every screen
 * in the room empties the same bank at the same moment. */
export function WinningView({ view }: PhaseViewProps) {
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
  const now = useNow(state !== undefined);
  const elapsed = Math.max(0, now - view.phaseStartedAt);
  const show = showAt(elapsed, cards, cardMs(), themes);
  const winner = winnerOf(state?.scores ?? []);
  return (
    <div class={styles.Root}>
      <ThemeCardsView
        roomCode={view.roomCode}
        choosing={false}
        myTurn={false}
        theme={undefined}
        picking={undefined}
        clockOffsetMs={view.clockOffsetMs}
        onPickTheme={() => {}}
        spent={undefined}
        themeMode={state?.themeMode ?? 'Random'}
        enabledThemes={state?.themes ?? []}
        customThemes={state?.customThemes ?? []}
        pace={state?.pace ?? 'Standard'}
        gone={show.gone}
        leaving={show.leaving}
      />
      {show.shown && winner !== undefined && <WinnerPanel view={view} id={winner.id} />}
    </div>
  );
}

/** The winner's panel: their face and their name, once the bank is empty. */
function WinnerPanel({ view, id }: { view: GameSessionView; id: string }) {
  const look = lookFor(view.playerLooks, id);
  if (look === undefined) return null;
  return (
    <div class={styles.Winner}>
      <div class={styles.Portrait}>
        <Character character={look.character} color={look.color} size="Fill" />
      </div>
      <span class={styles.Name}>{view.playerNames.get(id) ?? id}</span>
    </div>
  );
}
