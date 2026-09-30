import { Stack, Text } from '@/Design/Primitives';
import { TextField, Banner } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface JoinFieldsProps {
  name: string;
  roomCode: string;
  onNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
}

/** Name and room code inputs with their validation messages. */
export function JoinFields({
  name,
  roomCode,
  onNameChange,
  onRoomCodeChange,
}: JoinFieldsProps) {
  const nameMissing = name.trim().length === 0;
  const codeTooShort = roomCode.length > 0 && roomCode.length < GameConfig.limits.roomCodeLength;

  return (
    <Stack gap="Md">
      <Text variant="Body">{Strings.join.headline}</Text>
      <TextField
        value={name}
        placeholder={Strings.join.namePlaceholder}
        maxLength={GameConfig.limits.nameMaxLength}
        onChange={onNameChange}
      />
      <TextField
        value={roomCode}
        placeholder={Strings.join.roomPlaceholder}
        maxLength={GameConfig.limits.roomCodeLength}
        onChange={onRoomCodeChange}
      />
      {nameMissing && <Banner variant="Warning">{Strings.join.nameError}</Banner>}
      {codeTooShort && <Banner variant="Warning">{Strings.join.roomError}</Banner>}
    </Stack>
  );
}
