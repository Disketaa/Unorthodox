import { HostState, freshLobbyState } from './GameState';
import { assertNever } from '@/Core';
import type { GameAction } from './GameActions';
import {
  handleStartGame,
  handleChooseTheme,
  handleStartWriting,
  handleSubmitAnswer,
  handleStartReviewing,
  handleRejectGroup,
  handleEndReviewing,
  handleNextRound,
  handleFinal,
} from './PhaseActions';
import { handleBankPick } from './RandomPick';
import { handleGoToPhase } from './PhaseJumps';
import { handleNextTurn } from './Turns';
import { handleRoster } from './LobbyActions';

export function reducer(currentState: HostState | undefined, action: GameAction): HostState {
  const state: HostState = currentState ?? freshLobbyState();

  switch (action.type) {
    case 'JOIN':
    case 'SET_ONLINE':
    case 'KICK':
    case 'SET_LOOK':
    case 'SET_PACE':
      return handleRoster(state, action);
    case 'START_GAME':
      return handleStartGame(state, action);
    case 'CHOOSE_THEME':
      return handleChooseTheme(state, action);
    case 'START_RANDOM_PICK':
    case 'RESOLVE_RANDOM_PICK':
      return handleBankPick(state, action);
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
