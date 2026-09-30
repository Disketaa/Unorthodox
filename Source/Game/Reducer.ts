import { PlayerId } from '@/Core';
import { HostState } from './GameState';
import { assertNever } from '@/Core';
import { GameAction, handleJoin, handleSetLook, handleStartGame, handleSubmitAnswer, handleStartReviewing, handleRejectGroup, handleEndReviewing, handleNextRound, handleFinal } from './GameActions';

/**
 * Reducer function for the game state.
 * @param currentState Current host state
 * @param action Action to process
 * @returns New host state
 */
export function reducer(
  currentState: HostState | undefined,
  action: GameAction
): HostState {
  const state: HostState = currentState ?? {
    phase: 'Lobby',
    players: new Map(),
    cumulativeScores: new Map<PlayerId, number>(),
  };

  switch (action.type) {
    case 'JOIN':
      return handleJoin(state, action);
    case 'SET_LOOK':
      return handleSetLook(state, action);
    case 'START_GAME':
      return handleStartGame(state, action);
    case 'SUBMIT_ANSWER':
      return handleSubmitAnswer(state, action);
    case 'START_REVIEWING':
      return handleStartReviewing(state, action);
    case 'REJECT_GROUP':
      return handleRejectGroup(state, action);
    case 'END_REVIEWING':
      return handleEndReviewing(state, action);
    case 'NEXT_ROUND':
      return handleNextRound(state, action);
    case 'FINAL':
      return handleFinal(state);
    default:
      return assertNever(action);
  }
}
