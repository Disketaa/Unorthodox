import { Transport } from './Transport';
import type { BlockedReason } from './Protocol';
import { JoinRetry } from './JoinRetry';
import { clientId } from './ClientIdentity';
import { ClientInbox, isFromHost } from './ClientInbox';
import { stallHint, StallHintMs, type ConnectionHint } from './ConnectionHint';
import * as Game from '@/Game';
import { PlayerLook, ThemeId, createLogger } from '@/Core';

export type { BlockedReason } from './Protocol';

const log = createLogger('ClientSession');

/** How often the client asks the host where the game is. A suspended or offline client misses
 * the state messages sent on phase changes. Asking again on a timer also fixes the countdown on
 * waking, since the state carries the host's start time. */
export const SyncIntervalMs = 5_000;

export class ClientSession {
  private transport: Transport;
  private readonly joinRetry: JoinRetry;
  private updateListener: (() => void) | undefined = undefined;
  /** Asks the host for the current state, so a gap does not desync the client. */
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  /** Starts counting when the wait begins, so a stall can be reported without a poll. */
  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  /** What this device can say about a wait going on too long. */
  private connectionHint: ConnectionHint | undefined = undefined;

  constructor(transport: Transport) {
    this.transport = transport;
    this.joinRetry = new JoinRetry(transport);
    const inbox = new ClientInbox(transport, this.joinRetry, () => this.updateListener?.());

    // The host is reachable the moment it registers on the in-memory broker,
    // so the join can go out without waiting for a retry tick.
    transport.onHostReady(() => this.joinRetry.flush());

    transport.onMessage((message, fromHost) => {
      log('debug', 'onMessage', message, 'fromHost:', fromHost);
      if (isFromHost(message, fromHost)) {
        inbox.receive(message);
      } else if (fromHost) {
        log('warn', 'ignoring unrecognised host message');
      }
    });

    this.inbox = inbox;
  }

  private readonly inbox: ClientInbox;

  start(roomCode: string, playerName: string): void {
    // The host addresses us by the peer the transport sees, so there is no id
    // for us to declare here. The host assigns our game player id on join.
    this.transport.start(roomCode, playerName, false);
    // A suspended client misses state updates, so it keeps asking where the game is.
    this.syncTimer = setInterval(() => this.requestSync(), SyncIntervalMs);
    this.stallTimer = setTimeout(() => {
      if (this.inbox.playerId !== null) {
        return;
      }
      this.connectionHint = stallHint();
      log('warn', 'still no answer; hinting', this.connectionHint);
      this.updateListener?.();
    }, StallHintMs);
  }

  /** Subscribe to state changes so the UI can re-render. */
  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  /** Called when the host leaves. The transport only reports host departures to clients. */
  onHostLeave(listener: () => void): void {
    this.transport.onPeerLeave(() => listener());
  }

  /** Ask the host to resend the current state and phase start time. */
  requestSync(): void {
    if (this.inbox.playerId === null) {
      // Not in the room yet; the join retry covers this case.
      return;
    }
    log('debug', 'asking the host for a state sync');
    this.transport.sendToHost({ type: 'Sync' });
  }

  stop(): void {
    log('info', 'stopping client session');
    this.joinRetry.stop();
    if (this.syncTimer !== null) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    if (this.stallTimer !== null) {
      clearTimeout(this.stallTimer);
      this.stallTimer = null;
    }
    this.transport.stop();
    this.inbox.clear();
    this.connectionHint = undefined;
    this.updateListener = undefined;
  }

  join(playerName: string, look: PlayerLook): void {
    log('info', 'joining as', playerName);
    // Held and re-sent until the host seats us or refuses the join.
    this.joinRetry.send({ type: 'Join', name: playerName, look, clientId: clientId() });
  }

  /** Ask the host to change this player's character. The host may refuse: it keeps the character
   * a returning player already had, and it stops honouring changes once the game starts. */
  setLook(look: PlayerLook): void {
    if (this.inbox.playerId === null) {
      log('warn', 'cannot set a look before receiving a playerId');
      return;
    }
    this.transport.sendToHost({ type: 'SetLook', playerId: this.inbox.playerId, look });
  }

  /** Whether this client is seated yet, logging why not if it is not. Every action that names a
   * player goes through here, since all are meaningless before the host has assigned an id. */
  private seated(action: string): boolean {
    if (this.inbox.playerId !== null) {
      return true;
    }
    log('warn', `cannot ${action} before receiving a playerId`);
    return false;
  }

  /** Telling the room this player is back at work on an answer they already sent. Carries no
   * text: the room marks the seat and nothing else. */
  setEditingAnswer(editing: boolean): void {
    if (this.seated('write answer')) {
      this.transport.sendToHost({
        type: 'EditingAnswer',
        editing,
        playerId: this.inbox.playerId,
      });
    }
  }

  submitAnswer(text: string): void {
    if (this.seated('submit answer')) {
      this.transport.sendToHost({
        type: 'SubmitAnswer',
        text,
        playerId: this.inbox.playerId,
      });
    }
  }

  rejectGroup(groupId: number): void {
    if (this.seated('reject group')) {
      this.transport.sendToHost({
        type: 'RejectGroup',
        groupId,
        playerId: this.inbox.playerId,
      });
    }
  }

  /** Ask the host to play this round in this theme. The host refuses a press from anybody but
   * the player on turn, so the muted cards are not merely a promise the client keeps to itself. */
  chooseTheme(theme: ThemeId): void {
    if (this.seated('choose a theme')) {
      this.transport.sendToHost({
        type: 'ChooseTheme',
        theme,
        playerId: this.inbox.playerId,
      });
    }
  }

  getState(): Game.PublicState | undefined {
    return this.inbox.state;
  }

  getClockOffsetMs(): number {
    return this.inbox.clock.offset;
  }

  getPlayerId(): string | null {
    return this.inbox.playerId;
  }

  /** Why this client is not in a room, or undefined if it is in one. */
  getBlocked(): BlockedReason | undefined {
    return this.inbox.blocked;
  }

  /** What this device can say about a wait going on too long, or undefined while it is short. */
  getConnectionHint(): ConnectionHint | undefined {
    return this.inbox.playerId === null ? this.connectionHint : undefined;
  }

  /** How many players the room holds, as the host last reported it. Zero until a refusal says
   * otherwise, which is the only thing the UI reads it for. */
  getRoomLimit(): number {
    return this.inbox.roomLimit;
  }
}
