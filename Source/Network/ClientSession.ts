import { Transport } from './Transport';
import type { BlockedReason } from './Protocol';
import { JoinRetry } from './JoinRetry';
import { clientId } from './ClientIdentity';
import { ClientInbox, isFromHost } from './ClientInbox';
import { stallHint, StallHintMs, type ConnectionHint } from './ConnectionHint';
import * as Game from '@/Game';
import { ClientSender } from './ClientSender';
import { customThemesOf } from './ClientThemeCache';
import { PlayerLook, ThemeId, CustomTheme, createLogger } from '@/Core';

export type { BlockedReason } from './Protocol';

const log = createLogger('ClientSession');

export const SyncIntervalMs = 5_000;

export class ClientSession {
  private transport: Transport;
  private readonly joinRetry: JoinRetry;
  private updateListener: (() => void) | undefined = undefined;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private stallTimer: ReturnType<typeof setTimeout> | null = null;
  private connectionHint: ConnectionHint | undefined = undefined;

  constructor(transport: Transport) {
    this.transport = transport;
    this.joinRetry = new JoinRetry(transport);
    const inbox = new ClientInbox(transport, this.joinRetry, () => this.updateListener?.());
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
    this.sender = new ClientSender(transport, () => this.inbox.playerId);
  }

  private readonly sender: ClientSender;

  private readonly inbox: ClientInbox;

  start(roomCode: string, playerName: string): void {
    this.transport.start(roomCode, playerName, false);
    this.syncTimer = setInterval(() => this.requestSync(), SyncIntervalMs);
    this.stallTimer = setTimeout(() => {
      if (this.inbox.playerId !== null) return;
      this.connectionHint = stallHint();
      log('warn', 'still no answer; hinting', this.connectionHint);
      this.updateListener?.();
    }, StallHintMs);
  }

  onUpdate(listener: () => void): void {
    this.updateListener = listener;
  }

  onHostLeave(listener: () => void): void {
    this.transport.onPeerLeave(() => listener());
  }

  requestSync(): void {
    if (this.inbox.playerId === null) return;
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
    this.joinRetry.send({ type: 'Join', name: playerName, look, clientId: clientId() });
  }

  setLook(look: PlayerLook): void {
    this.sender.setLook(look);
  }

  setEditingAnswer(editing: boolean): void {
    this.sender.setEditingAnswer(editing);
  }

  submitAnswer(text: string): void {
    this.sender.submitAnswer(text);
  }

  rejectGroup(groupId: number): void {
    this.sender.sendMark('RejectGroup', groupId, 'reject group');
  }

  likeGroup(groupId: number): void {
    this.sender.sendMark('LikeGroup', groupId, 'like an answer');
  }

  chooseTheme(theme: ThemeId): void {
    this.sender.chooseTheme(theme);
  }

  sendCustomThemes(themes: readonly CustomTheme[]): void {
    this.sender.sendCustomThemes(themes);
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
  getBlocked(): BlockedReason | undefined {
    return this.inbox.blocked;
  }
  getConnectionHint(): ConnectionHint | undefined {
    return this.inbox.playerId === null ? this.connectionHint : undefined;
  }
  getRoomLimit(): number {
    return this.inbox.roomLimit;
  }
  getCustomThemes(): readonly CustomTheme[] {
    return customThemesOf(this.inbox.state);
  }
}
