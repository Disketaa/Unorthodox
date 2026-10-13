import { Stack, Text } from '@/Design/Primitives';
import { AnswerCards } from '@/Design/Components';

export interface ReviewGroup {
  groupId: number;
  text: string;
  playerCount: number;
  voted: boolean;
  /** Whether this is the card of a player who wrote nothing. Such a card is a record and not a
   * control: there is no answer on it to vote out, and a vote that changed nothing would be a
   * button the room pressed and saw nothing happen. */
  isEmpty: boolean;
}

export interface ReviewScreenProps {
  topic: string;
  groups: readonly ReviewGroup[];
  /** How many answers the room has got to. Left out the whole board is up, which is every screen
   * but the one the round plays on. */
  revealed?: number;
  /** Mute an answer, or take the mute back. Only the host is given one, and it is left out
   * entirely on every other screen rather than passed and ignored, so a card that cannot be
   * pressed is not pressable at all. */
  onReject?: (groupId: number) => void;
}

/** Reviewing phase: all answers at once as a board of panels, duplicates grouped and carrying
 * their count, and the host able to mute any of them. A board rather than a column of rows
 * because the round is read as one thing: how many answers, and which more than one wrote. */
export function ReviewScreen({ topic, groups, revealed, onReject }: ReviewScreenProps) {
  return (
    <Stack gap="Md" grow align="Stretch">
      {/* The question over the board, centred, since every card on the board is centred. */}
      <Text variant="Topic">{topic}</Text>
      <AnswerCards
        answers={groups.map((group) => ({
          id: group.groupId,
          text: group.text,
          count: group.playerCount,
          voted: group.voted,
          blank: group.isEmpty,
        }))}
        revealed={revealed}
        onReject={onReject}
      />
    </Stack>
  );
}
