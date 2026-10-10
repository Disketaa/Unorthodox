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
import { handleRevealQuestion } from './PhaseActions';
import { handleEditingAnswer } from './AnswerEditing';
import { handleGoToPhase } from './PhaseJumps';
import { handleNextTurn } from './Turns';
import { handleRoster } from './LobbyActions';
import { handleHold, isRefusedWhileHeld } from './Pause';

export function reducer(currentState: HostState | undefined, action: GameAction): HostState {
  const state: HostState = currentState ?? freshLobbyState();
  if (isRefusedWhileHeld(state, action)) return state;
  return dispatch(state, action);
}

/** The moves that are the room's own rather than the flow's: who is in it, and whether it is
 * running. A guard rather than a second switch, so the flow below stays only about phases. */
type RoomAction = Extract<
  GameAction,
  { type: 'JOIN' | 'SET_ONLINE' | 'KICK' | 'SET_LOOK' | 'SET_PACE' | 'PAUSE' | 'RESUME' }
>;

function isRoomAction(action: GameAction): action is RoomAction {
  switch (action.type) {
    case 'JOIN':
    case 'SET_ONLINE':
    case 'KICK':
    case 'SET_LOOK':
    case 'SET_PACE':
    case 'PAUSE':
    case 'RESUME':
      return true;
    default:
      return false;
  }
}

/** Which handler owns each action, grouped by the handler rather than by the action: two actions
 * from one hand are one rule, and listing them together is what says so. */
function dispatch(state: HostState, action: GameAction): HostState {
  if (isRoomAction(action)) {
    return action.type === 'PAUSE' || action.type === 'RESUME'
      ? handleHold(state, action)
      : handleRoster(state, action);
  }
  switch (action.type) {
    case 'START_GAME':
      return handleStartGame(state, action);
    case 'CHOOSE_THEME':
      return handleChooseTheme(state, action);
    case 'START_RANDOM_PICK':
    case 'RESOLVE_RANDOM_PICK':
      return handleBankPick(state, action);
    case 'REVEAL_QUESTION':
      return handleRevealQuestion(state, action);
    case 'START_WRITING':
      return handleStartWriting(state, action);
    case 'SUBMIT_ANSWER':
      return handleSubmitAnswer(state, action);
    case 'EDITING_ANSWER':
      return handleEditingAnswer(state, action);
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
