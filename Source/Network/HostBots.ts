/** The bots answering the rounds the host opens. Split out of the session so the file that owns
 * the phase flow owns none of the invented players, and so the pass is one thing with one call. */
import { botAnswers } from './Bot';
import type { GameAction, HostState } from '@/Game';

/** The two things answering a round needs: the room as it stands, and the one way to write to
 * it. Passing them keeps this file needing nothing back from the class that owns them. */
export interface BotAnswerHost {
  getState(): HostState | undefined;
  apply(action: GameAction): void;
}

/** Write an answer for every bot the round is still waiting on. Called after each write to the
 * room: the pass a bot's own answer triggers finds that seat answered and does nothing, so this
 * cannot recurse. */
export function answerBots(host: BotAnswerHost, random: () => number = Math.random): void {
  const state = host.getState();
  if (state === undefined) return;
  for (const action of botAnswers(state, random)) host.apply(action);
}
