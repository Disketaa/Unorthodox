import { PublicState, Pace } from '@/Game';
import { SessionRole } from '../Session';
import { BlockedReason, ConnectionHint } from '../Session';
import {
  PlayerId,
  PlayerLook,
  CharacterColor,
  CharacterId,
  ThemeId,
  CustomTheme,
} from '@/Core';
import { type ThemeMode } from '@/Core';
import { type SessionPhase } from './UseSessionPhase';
import { type BoardMarks } from './BoardMarks';

/** Everything a screen is drawn from: the phase in view, the moves it can make, and what a board
 * of answers is showing — the host's mutes, the room's like counts, which of those were this
 * player's own presses, and whether they wrote an answer at all. */
export interface GameSessionView extends SessionPhase, BoardMarks {
  role: SessionRole;
  isHost: boolean;
  roomCode: string;
  playerId: PlayerId | null;
  publicState: PublicState | undefined;
  /** Whether the host is holding the room still, which stops every clock and every answer in it.
   * Read from the room rather than kept here, since a screen that guessed for itself would be
   * the one screen in the room still playing. */
  paused: boolean;
  hasSubmitted: boolean;
  /** Whether this player is writing over an answer they already sent, which puts them back at
   * work in the bar. Held here as well as sent, so their own seat does not wait on the round
   * trip. */
  editing: boolean;
  setEditing: (editing: boolean) => void;
  hostLeft: boolean;
  /** Why this player is not in the room, if they are not. */
  blocked: BlockedReason | undefined;
  /** What this device can say about a wait going on too long, if anything yet. */
  connectionHint: ConnectionHint | undefined;
  /** How many players the room holds, which the full-room refusal quotes. */
  roomLimit: number;
  /** The custom themes this room knows, so every screen can draw them in the bank. */
  customThemes: readonly CustomTheme[];
  /** The bank this room was offered: dealt once, from the room's own pool and its code, and
   * given to every screen. One deal rather than one per screen, since the enchantment roll is
   * drawn against this list and a second deal elsewhere rolls a different one. */
  bank: readonly ThemeId[];
  /** The host removing a player from the room. */
  kickPlayer: (playerId: PlayerId) => void;
  /** This player's own character, as the host has it. Not the roll made on this device: a
   * returning player is given the character the host kept, so the picker shows what the rest of
   * the room actually sees. */
  ownLook: PlayerLook | undefined;
  setLook: (character: CharacterId, color: CharacterColor) => void;
  /** Asking for a pace or for the room's themes: both the host's alone. */
  setPace: (pace: Pace) => void;
  setThemes: (mode: ThemeMode, themes: readonly ThemeId[]) => void;
  /** The host pasting in custom themes, which every client is then told. */
  setCustomThemes: (themes: readonly CustomTheme[]) => void;
  /** The host striking one custom theme out of the room and out of this browser. */
  removeCustomTheme: (name: string) => void;
  /** Holding the room still, or letting it run again. */
  setPaused: (paused: boolean) => void;
  /** Put an invented player in the room. Only the host's, and only while debugging. */
  addBot: () => void;
  /** Hand the room's turn to the next player. Only the host's, and only while debugging. */
  nextTurn: () => void;
  startGame: () => void;
  /** Answering the theme bank on this player's behalf. The room sees the answer, not the player. */
  chooseTheme: (theme: ThemeId) => void;
  nextPhase: () => void;
  submitAnswer: (text: string) => void;
  rejectGroup: (groupId: number) => void;
  likeGroup: (groupId: number) => void;
  nextRound: () => void;
  playAgain: () => void;
  /** Leave the room and go back to the entry screen. */
  exitRoom: () => void;
}
