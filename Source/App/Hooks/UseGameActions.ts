import { useCallback, useRef } from 'preact/hooks';
import { GameConfig, Pace } from '@/Game';
import { CharacterColor, CharacterId, ThemeId } from '@/Core';
import { topicAt } from '@/Content';
import { Session } from '../Session';
import { navigate } from '../Routes';

export interface GameActions {
  startGame: () => void;
  /** Answering the theme bank. The room's answer rather than this screen's, so the picked card
   * opens in every browser at once. Refused by the host from anybody but the player on turn. */
  chooseTheme: (theme: ThemeId) => void;
  nextRound: () => void;
  /** Wherever the phase table says goes next, for the host's dock. */
  nextPhase: () => void;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  setPace: (pace: Pace) => void;
  addBot: () => void;
  nextTurn: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  playAgain: () => void;
}

/** The round the room is on, and the moves that change it. A ref rather than state: nothing is
 * drawn from it, only the next topic read, and a re-render on every round would be a render
 * that changes nothing. */
function useRoundFlow(session: Session) {
  const roundsRef = useRef(0);

  const startGame = useCallback(() => {
    roundsRef.current = 1;
    session.startGame();
  }, [session]);

  const chooseTheme = useCallback(
    (theme: ThemeId) => {
      session.chooseTheme(theme);
    },
    [session]
  );

  const nextRound = useCallback(() => {
    const next = roundsRef.current + 1;
    roundsRef.current = next;
    if (next >= GameConfig.rounds.count) {
      session.finish();
      return;
    }
    session.nextRound();
  }, [session]);

  const nextPhase = useCallback(() => {
    session.nextPhase(topicAt(roundsRef.current - 1));
  }, [session]);

  return { startGame, chooseTheme, nextRound, nextPhase };
}

/** Everything the UI can ask the session to do. Only the host acts on round flow. */
export function useGameActions(
  session: Session,
  onSubmitted: () => void,
  onVoted: (groupId: number) => void
): GameActions {
  return {
    ...useRoundFlow(session),
    setLook: (character, color) => session.setLook({ character, color }),
    setPace: (pace) => session.setPace(pace),
    addBot: () => session.addBot(),
    nextTurn: () => session.nextTurn(),
    submitAnswer: (text: string) => {
      session.submitAnswer(text);
      onSubmitted();
    },
    rejectGroup: (groupId: number) => {
      session.rejectGroup(groupId);
      onVoted(groupId);
    },
    playAgain: () => {
      navigate('');
    },
  };
}
