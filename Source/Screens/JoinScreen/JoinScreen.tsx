import { Stack, Text } from '@/Design/Primitives';
import { Button, Card } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';
import { JoinFields } from './JoinFields';

export interface JoinScreenProps {
  name: string;
  roomCode: string;
  onNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
  onJoin: () => void;
  onCreate: () => void;
}

/** Entry screen: pick a name, then enter an existing room code or create a room. */
export function JoinScreen({
  name,
  roomCode,
  onNameChange,
  onRoomCodeChange,
  onJoin,
  onCreate,
}: JoinScreenProps) {
  const nameMissing = name.trim().length === 0;
  const codeValid = roomCode.length === GameConfig.limits.roomCodeLength;

  return (
    <Stack gap="Lg" padding="Lg" align="Stretch">
      <Text variant="Title">{Strings.app.title}</Text>
      <Text variant="Caption">{Strings.join.hint}</Text>
      <Card variant="Elevated">
        <Stack gap="Md">
          <JoinFields
            name={name}
            roomCode={roomCode}
            onNameChange={onNameChange}
            onRoomCodeChange={onRoomCodeChange}
          />
          <Button
            variant="Primary"
            size="Large"
            disabled={nameMissing || !codeValid}
            onClick={onJoin}
          >
            {Strings.join.joinButton}
          </Button>
          <Button variant="Secondary" size="Medium" disabled={nameMissing} onClick={onCreate}>
            {Strings.join.createButton}
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
