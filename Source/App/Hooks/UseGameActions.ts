import { useCallback, useRef } from 'preact/hooks';
import { GameConfig, Pace, PublicState } from '@/Game';
import { CharacterColor, CharacterId, ThemeId } from '@/Core';
import { questionFor, topicAt } from '@/Content';
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
  /** The round's question arriving word by word, drawn from the theme the room just answered. */
  revealQuestion: () => void;
  /** The round starting once the question has been read. Goes through the writing move rather
   * than the dock's jump, since starting a round is what hands the turn on. */
  startRound: () => void;
  /** Holding the room still, or letting it run again. */
  setPaused: (paused: boolean) => void;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  setPace: (pace: Pace) => void;
  addBot: () => void;
  nextTurn: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  playAgain: () => void;
}

/** The question the answered theme is being asked, or undefined while the bank is still open.
 * Read off the room rather than remembered, so the question a round asks cannot drift from the
 * theme the room actually pressed. */
function questionForRoom(state: PublicState | undefined): string | undefined {
  if (state?.phase !== 'Choosing' || state.theme === undefined) return undefined;
  const spent = state.spent.find((entry) => entry.theme === state.theme);
  return questionFor(state.theme, spent?.rounds ?? 0);
}

/** The round the room is on, and the moves that change it. Refs rather than state: nothing is
 * drawn from them, only the next question and topic read. They are written while rendering, so
 * the frame the room answers the bank on already has this round's question in hand. */
function useRoundFlow(session: Session, publicState: PublicState | undefined) {
  const roundsRef = useRef(0);
  const questionRef = useRef<string | undefined>(undefined);
  questionRef.current = questionForRoom(publicState);

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

  const revealQuestion = useCallback(() => {
    session.revealQuestion(questionRef.current ?? topicAt(roundsRef.current - 1));
  }, [session]);

  const startRound = useCallback(() => {
    // The question the room was shown, not a fresh draw: the words they read have to be the ones
    // they are answering. A round the host jumped into rather than played has no question, and
    // falls back to the generic bank.
    session.startWriting(questionRef.current ?? topicAt(roundsRef.current - 1));
  }, [session]);

  return { startGame, chooseTheme, nextRound, nextPhase, revealQuestion, startRound };
}

/** Everything the UI can ask the session to do. Only the host acts on round flow. */
export function useGameActions(
  session: Session,
  publicState: PublicState | undefined,
  onSubmitted: () => void,
  onVoted: (groupId: number) => void
): GameActions {
  return {
    ...useRoundFlow(session, publicState),
    setLook: (character, color) => session.setLook({ character, color }),
    setPace: (pace) => session.setPace(pace),
    setPaused: (paused) => session.setPaused(paused),
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
