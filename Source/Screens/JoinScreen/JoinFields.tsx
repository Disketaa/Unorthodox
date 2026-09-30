import { Stack } from '@/Design/Primitives';
import { TextField } from '@/Design/Components';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';

export interface JoinFieldsProps {
  name: string;
  roomCode: string;
  /** Reveals the validation messages, once the player has tried to continue. */
  showErrors: boolean;
  onNameChange: (value: string) => void;
  onRoomCodeChange: (value: string) => void;
}

/**
 * Name and room code inputs with their validation messages.
 *
 * The messages stay hidden until the player tries to continue, so an untouched
 * form is not scolded. They clear themselves as soon as the field is filled in.
 */
export function JoinFields({
  name,
  roomCode,
  showErrors,
  onNameChange,
  onRoomCodeChange,
}: JoinFieldsProps) {
  return (
    <Stack gap="Md">
      <TextField
        value={name}
        placeholder={Strings.join.namePlaceholder}
        maxLength={GameConfig.limits.nameMaxLength}
        error={showErrors && name.trim().length === 0}
        errorText={Strings.join.nameError}
        onChange={onNameChange}
      />
      <TextField
        value={roomCode}
        placeholder={Strings.join.roomPlaceholder}
        maxLength={GameConfig.limits.roomCodeLength}
        inputMode="numeric"
        error={showErrors && roomCode.length !== GameConfig.limits.roomCodeLength}
        errorText={Strings.join.roomError}
        onChange={onRoomCodeChange}
      />
    </Stack>
  );
}
