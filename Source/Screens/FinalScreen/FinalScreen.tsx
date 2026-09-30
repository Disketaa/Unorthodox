import { Stack, Text } from '@/Design/Primitives';
import { Button, Card, ScoreRow } from '@/Design/Components';
import { Strings } from '@/Content';
import { ScoreEntry } from '../Types';

export interface FinalScreenProps {
  scores: readonly ScoreEntry[];
  isHost: boolean;
  onPlayAgain: () => void;
}

/** Final ranking. */
export function FinalScreen({ scores, isHost, onPlayAgain }: FinalScreenProps) {
  return (
    <Stack gap="Lg" align="Stretch">
      <Text variant="Title">{Strings.final.headline}</Text>
      <Card variant="Elevated">
        <Stack gap="Sm">
          {scores.map((entry, index) => (
            <ScoreRow
              key={entry.playerName}
              playerName={entry.playerName}
              character={entry.character}
              color={entry.color}
              score={entry.score}
              rank={entry.rank}
              index={index}
            />
          ))}
        </Stack>
      </Card>
      {isHost && (
        <Button variant="Primary" size="Large" onClick={onPlayAgain}>
          {Strings.final.playAgain}
        </Button>
      )}
    </Stack>
  );
}
