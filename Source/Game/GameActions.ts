/** Every change the room can be put through, as one union. The handlers live beside what they
 * touch: the roster in `LobbyActions.ts`, the turn in `Turns.ts`, and everything that moves the
 * room between phases in `PhaseActions.ts`. */
import type { PlayerId, PlayerLook, ThemeId, ThemeMode, CustomTheme } from '@/Core';
import type { Pace } from './GameConfig';
import type { PhaseName } from './PhaseFlow';

export type GameAction =
  | { type: 'JOIN'; playerId: PlayerId; name: string; look: PlayerLook }
  | { type: 'SET_ONLINE'; playerId: PlayerId; isOnline: boolean }
  | { type: 'KICK'; playerId: PlayerId }
  | { type: 'SET_LOOK'; playerId: PlayerId; look: PlayerLook }
  | { type: 'SET_PACE'; pace: Pace }
  /** The themes the host has named and which way the room is given them: the pool every bank is
   * dealt from. The whole selection rather than the one theme pressed, since picking a theme is
   * taking it out of the room. The mode rides along so one press moves the pool. */
  | { type: 'SET_THEMES'; mode: ThemeMode; themes: readonly ThemeId[] }
  /** The custom themes this room knows: their names, tints and questions. The host pastes them
   * in and every client is told, so every screen draws the same bank. */
  | { type: 'SET_CUSTOM_THEMES'; themes: readonly CustomTheme[] }
  /** One custom theme struck out of the room and out of this browser: the theme by its name,
   * which is what it is keyed by. Setting themes only ever adds, so a theme that could not be
   * taken away could never be replaced by a paste of the same name. */
  | { type: 'REMOVE_CUSTOM_THEME'; name: string }
  /** The lobby into the first phase of play, which chooses a theme rather than answering one. */
  | { type: 'START_GAME'; durationMs: number; startedAt: number; leadInMs?: number }
  /** The room's answer to the bank: this theme, for this round. Carries who pressed it so the
   * host can refuse a press from anybody but the player whose turn it is, and the seats the
   * card's effect reaches, worked out by the host from the standings rather than rolled here. */
  | {
      type: 'CHOOSE_THEME';
      playerId: PlayerId;
      theme: ThemeId;
      at: number;
      affectedPlayers?: PlayerId[];
    }
  /** Nobody answered the bank before its clock ran out, so the room is answering it. Carries the
   * theme rather than rolling one here, since the reducer is the rule and not the dice. The
   * answer is held back until `RESOLVE_RANDOM_PICK`, which is what gives the sweep its length. */
  | { type: 'START_RANDOM_PICK'; theme: ThemeId; startedAt: number }
  /** The room's roll commits, once the sweep has run. No player to name: the room chose it, not
   * one of the seats. Carries the seats the card's effect reaches, worked out by the host. */
  | { type: 'RESOLVE_RANDOM_PICK'; at: number; affectedPlayers?: PlayerId[] }
  /** The theme answered, so the round's question is drawn from its bank and starts arriving. The
   * question travels on the action rather than being read from a catalogue here: what a theme
   * asks about is the content's business, and the reducer is the rule and not the dice. */
  | { type: 'REVEAL_QUESTION'; question: string; at: number }
  /** The room into a round, once the question has been read. Carries the topic rather than
   * reading one from a catalogue, since what a theme asks about is the content's business and
   * not the state's. */
  | { type: 'START_WRITING'; topic: string; durationMs: number; startedAt: number }
  | { type: 'SUBMIT_ANSWER'; playerId: PlayerId; text: string }
  /** A player writing over an answer they already sent, so their seat goes back to work in the
   * room rather than only in their own browser. Takes no text, since an answer nobody has
   * finished sending is not something the room is allowed to read. */
  | { type: 'EDITING_ANSWER'; playerId: PlayerId; editing: boolean }
  | { type: 'START_REVIEWING'; startedAt: number; durationMs: number }
  | { type: 'REJECT_GROUP'; playerId: PlayerId; groupId: number }
  | { type: 'LIKE_GROUP'; playerId: PlayerId; groupId: number }
  | { type: 'END_REVIEWING'; startedAt: number; durationMs: number }
  /** The end of one round into the next one's theme choice. */
  | { type: 'NEXT_ROUND'; durationMs: number; startedAt: number }
  | { type: 'NEXT_TURN' }
  /** The host holding the room: every clock and every answer stops where it is. Carries the
   * moment it was held, which is what letting go moves the phase's clock on by. */
  | { type: 'PAUSE'; at: number }
  /** The room running again, with the moment it was let go. */
  | { type: 'RESUME'; at: number }
  | { type: 'FINAL' }
  /** The host's console putting the room straight into a phase, without playing there. Carries
   * the round's own data because a phase is a state and not only a screen. */
  | {
      type: 'GO_TO_PHASE';
      phase: PhaseName;
      topic: string;
      durationMs: number;
      startedAt: number;
    };

export type ActionOf<T extends GameAction['type']> = Extract<GameAction, { type: T }>;
