import { useCallback, useRef } from 'preact/hooks';
import { GameConfig, Pace } from '@/Game';
import { CharacterColor, CharacterId } from '@/Core';
import { topicAt } from '@/Content';
import { Session } from '../Session';
import { navigate } from '../Routes';

export interface GameActions {
  startGame: () => void;
  nextRound: () => void;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  setPace: (pace: Pace) => void;
  addBot: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  playAgain: () => void;
}

/** Everything the UI can ask the session to do. Only the host acts on round flow. */
export function useGameActions(
  session: Session,
  onSubmitted: () => void,
  onVoted: (groupId: number) => void,
): GameActions {
  const roundsRef = useRef(0);

  const startGame = useCallback(() => {
    roundsRef.current = 1;
    session.startGame(topicAt(0), GameConfig.timing.writingDurationMs);
  }, [session]);

  const nextRound = useCallback(() => {
    const next = roundsRef.current + 1;
    roundsRef.current = next;
    if (next >= GameConfig.rounds.count) {
      session.finish();
      return;
    }
    session.startNextRound(topicAt(next - 1), GameConfig.timing.writingDurationMs);
  }, [session]);

  return {
    startGame,
    nextRound,
    setLook: (character, color) => session.setLook({ character, color }),
    setPace: (pace) => session.setPace(pace),
    addBot: () => session.addBot(),
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
