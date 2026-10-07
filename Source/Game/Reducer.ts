import { HostState, freshLobbyState } from './GameState';
import { assertNever } from '@/Core';
import type { GameAction } from './GameActions';
import {
  handleStartGame,
  handleStartWriting,
  handleSubmitAnswer,
  handleStartReviewing,
  handleRejectGroup,
  handleEndReviewing,
  handleNextRound,
  handleFinal,
  handleGoToPhase,
} from './PhaseActions';
import { handleNextTurn } from './Turns';
import {
  handleJoin,
  handleSetLook,
  handleSetOnline,
  handleKick,
  handleSetPace,
} from './LobbyActions';

export function reducer(currentState: HostState | undefined, action: GameAction): HostState {
  const state: HostState = currentState ?? freshLobbyState();

  switch (action.type) {
    case 'JOIN':
      return handleJoin(state, action);
    case 'SET_ONLINE':
      return handleSetOnline(state, action);
    case 'KICK':
      return handleKick(state, action);
    case 'SET_LOOK':
      return handleSetLook(state, action);
    case 'SET_PACE':
      return handleSetPace(state, action);
    case 'START_GAME':
      return handleStartGame(state, action);
    case 'START_WRITING':
      return handleStartWriting(state, action);
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
    case 'NEXT_TURN':
      return handleNextTurn(state);
    case 'FINAL':
      return handleFinal(state);
    case 'GO_TO_PHASE':
      return handleGoToPhase(state, action);
    default:
      return assertNever(action);
  }
}
