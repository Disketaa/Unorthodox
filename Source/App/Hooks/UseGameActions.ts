import { useCallback, useRef } from 'preact/hooks';
import { GameConfig, Pace, PublicState, questionFor } from '@/Game';
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
  /** Wherever the phase table says goes next, for the host's dock. An unanswered bank is the one
   * phase the table's move would break, since Writing with nothing pressed on it has no topic,
   * so the dock answers the bank itself and both halves land in the same press. */
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
  setEditingAnswer: (editing: boolean) => void;
  rejectGroup: (groupId: number) => void;
  playAgain: () => void;
}

/** The question the answered theme is being asked, or undefined while the bank is still open.
 * Read off the room rather than remembered, so the question a round asks cannot drift from the
 * theme the room actually pressed. */
function questionForRoom(state: PublicState | undefined, roomCode: string): string | undefined {
  if (state?.phase !== 'Choosing' || state.theme === undefined) return undefined;
  const spent = state.spent.find((entry) => entry.theme === state.theme);
  return questionFor(roomCode, state.theme, spent?.rounds ?? 0);
}

/** The dock's step, which walks the round the way the room's own clocks do rather than jumping
 * over them: an unanswered bank is answered by the room in the same press, an answered one
 * reveals its question, and only a room already showing the question steps to the table's move. */
function stepPhase(
  session: Session,
  publicState: PublicState | undefined,
  question: string | undefined,
  topic: string
): void {
  const choosing = publicState?.phase === 'Choosing' ? publicState : undefined;
  if (choosing !== undefined && choosing.theme === undefined) {
    session.startRandomPick();
    session.resolveRandomPick();
    return;
  }
  if (choosing !== undefined && choosing.question === undefined) {
    session.revealQuestion(question ?? topic);
    return;
  }
  session.nextPhase(question ?? topic);
}

/** The round the room is on, and the moves that change it. Refs rather than state: nothing is
 * drawn from them, only the next question and topic read. They are written while rendering, so
 * the frame the room answers the bank on already has this round's question in hand. */
function useRoundFlow(
  session: Session,
  publicState: PublicState | undefined,
  roomCode: string
) {
  const roundsRef = useRef(0);
  const questionRef = useRef<string | undefined>(undefined);
  questionRef.current = questionForRoom(publicState, roomCode);

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

  const topic = () => topicAt(roundsRef.current - 1);

  const nextPhase = useCallback(
    () => stepPhase(session, publicState, questionRef.current, topic()),
    [session, publicState]
  );

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
  roomCode: string,
  onSubmitted: () => void,
  onVoted: (groupId: number) => void
): GameActions {
  return {
    ...useRoundFlow(session, publicState, roomCode),
    setLook: (character, color) => session.setLook({ character, color }),
    setPace: (pace) => session.setPace(pace),
    setPaused: (paused) => session.setPaused(paused),
    addBot: () => session.addBot(),
    nextTurn: () => session.nextTurn(),
    submitAnswer: (text: string) => {
      session.submitAnswer(text);
      onSubmitted();
    },
    setEditingAnswer: (editing: boolean) => session.setEditingAnswer(editing),
    rejectGroup: (groupId: number) => {
      session.rejectGroup(groupId);
      onVoted(groupId);
    },
    playAgain: () => {
      navigate('');
    },
  };
}
