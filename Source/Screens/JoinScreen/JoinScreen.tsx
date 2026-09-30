import { Stack, Text } from '@/Design/Primitives';
import { Button, Card } from '@/Design/Components';
import { Strings } from '@/Content';
import { JoinFields } from './JoinFields';
import { useJoinForm } from './UseJoinForm';

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
  const { errors, submitJoin, submitCreate } = useJoinForm(name, roomCode);

  return (
    <Stack gap="Lg" align="Stretch">
      <Text variant="Display">{Strings.app.title}</Text>
      <Card variant="Elevated">
        <Stack gap="Md">
          <JoinFields
            name={name}
            roomCode={roomCode}
            showErrors={errors.showErrors}
            onNameChange={onNameChange}
            onRoomCodeChange={onRoomCodeChange}
          />
          <Button variant="Primary" size="Large" onClick={() => submitJoin(onJoin)}>
            {Strings.join.joinButton}
          </Button>
          <Button variant="Secondary" size="Medium" onClick={() => submitCreate(onCreate)}>
            {Strings.join.createButton}
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
