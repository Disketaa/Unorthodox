import { ComponentChildren } from 'preact';
import { Stack } from '@/Design/Primitives';
import { Banner, Button } from '@/Design/Components';
import { GameConfig } from '@/Game';
import { Strings } from '@/Content';

export interface LobbyStartProps {
  enoughPlayers: boolean;
  roomFull: boolean;
  isHost: boolean;
  /** The host's own note about this tab, carried in so it sits among the others. */
  note?: ComponentChildren;
  onStart: () => void;
}

/**
 * The foot of the lobby: a note for whoever cannot press Start, and Start itself
 * for the host once it would work.
 */
export function LobbyStart({
  enoughPlayers,
  roomFull,
  isHost,
  note,
  onStart,
}: LobbyStartProps) {
  if (!isHost) {
    // The same plank as the host's own notes, so everyone in the room is reading
    // one kind of message rather than a caption beside a coloured block.
    return <Banner variant="Info">{Strings.lobby.waitingForHost}</Banner>;
  }
  /*
   * The Start button appears once the room has somebody to play with.
   *
   * Only the minimum is a condition: a full room is still a room that can start, and
   * a host who has filled it by hand should not have the one thing they came for
   * taken away at the moment it becomes possible. The banner above says plainly what
   * a full room is, which is a fact rather than a reason to stop.
   *
   * Never shown disabled: a greyed-out button still has to be read past and worked
   * out. Half-strength gold on white reads as broken rather than as not yet.
   */
  const canStart = enoughPlayers;
  /*
   * The notes at `Sm` and the Start button at `Md`.
   *
   * The notes are one kind of thing said about the same moment, so they are spaced as
   * a paragraph; the button is not a note, and the wider gap is what separates the
   * room's remarks from the room's one action. Where no button can show, the notes
   * close the group themselves and the smaller gap is the only gap there.
   */
  return (
    <Stack gap="Md" align="Stretch">
      <Stack gap="Sm" align="Stretch">
        {roomFull && <Banner variant="Accent">{Strings.lobby.roomFull}</Banner>}
        {!enoughPlayers && (
          <Banner variant="Info">
            {Strings.lobby.notEnoughPlayers(GameConfig.limits.minPlayers)}
          </Banner>
        )}
        {note}
      </Stack>
      {canStart && (
        <Button variant="Primary" size="Large" onClick={onStart}>
          {Strings.lobby.startButton}
        </Button>
      )}
    </Stack>
  );
}
