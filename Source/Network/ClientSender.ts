/** What a seated client says to the host. Every one of these needs the seat the host gave this
 * client, and none can be sent before that seat arrives, so the guard and the send live here
 * rather than being repeated in each method of the session. */
import type { Transport } from './Transport';
import type { PlayerLook, ThemeId, CustomTheme } from '@/Core';
import { createLogger } from '@/Core';

const log = createLogger('ClientSender');

/** A client holding its own seat, or not yet: with no seat it can say nothing, and it says why
 * once per press rather than dropping the message silently. */
export class ClientSender {
  constructor(
    private readonly transport: Transport,
    private readonly playerId: () => string | null
  ) {}

  private seated(action: string): string | null {
    const id = this.playerId();
    if (id !== null) return id;
    log('warn', `cannot ${action} before receiving a playerId`);
    return null;
  }

  setLook(look: PlayerLook): void {
    const id = this.seated('set a look');
    if (id === null) return;
    this.transport.sendToHost({ type: 'SetLook', playerId: id, look });
  }

  setEditingAnswer(editing: boolean): void {
    const id = this.seated('write answer');
    if (id === null) return;
    this.transport.sendToHost({ type: 'EditingAnswer', editing, playerId: id });
  }

  submitAnswer(text: string): void {
    const id = this.seated('submit answer');
    if (id === null) return;
    this.transport.sendToHost({ type: 'SubmitAnswer', text, playerId: id });
  }

  sendMark(type: 'RejectGroup' | 'LikeGroup', groupId: number, action: string): void {
    const id = this.seated(action);
    if (id === null) return;
    this.transport.sendToHost({ type, groupId, playerId: id });
  }

  chooseTheme(theme: ThemeId): void {
    const id = this.seated('choose a theme');
    if (id === null) return;
    this.transport.sendToHost({ type: 'ChooseTheme', theme, playerId: id });
  }

  sendCustomThemes(themes: readonly CustomTheme[]): void {
    const id = this.seated('paste custom themes');
    if (id === null) return;
    this.transport.sendToHost({ type: 'SetCustomThemes', themes });
  }
}
