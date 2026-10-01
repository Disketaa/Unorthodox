import { Stack, Text } from '@/Design/Primitives';
import { Button, Card, Wordmark } from '@/Design/Components';
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

/**
 * Enter tries to join, from either field.
 *
 * The room code is what a player has just typed or read off someone else's screen,
 * and on a phone the keyboard's return key is the only key under the thumb: making
 * it join is what stops the code being retyped. A focused button is left to its own
 * click, or the press would be counted twice.
 */
function joinsOnEnter(event: KeyboardEvent, submitJoin: () => void): void {
  if (event.key !== 'Enter') {
    return;
  }
  if (event.target instanceof HTMLElement && event.target.tagName === 'BUTTON') {
    return;
  }
  // The default would insert a newline or resubmit nothing; the join is ours to do.
  event.preventDefault();
  submitJoin();
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
  const tryJoin = () => submitJoin(onJoin);

  return (
    <Stack gap="Lg" align="Stretch">
      <Wordmark label={Strings.app.title} />
      <Card variant="Elevated">
        <Stack gap="Md" align="Stretch">
          <div onKeyDown={(event) => joinsOnEnter(event, tryJoin)}>
            <JoinFields
              name={name}
              roomCode={roomCode}
              showNameError={errors.showNameError}
              showCodeError={errors.showCodeError}
              onNameChange={onNameChange}
              onRoomCodeChange={onRoomCodeChange}
            />
          </div>
          <Button variant="Primary" size="Large" onClick={tryJoin}>
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
