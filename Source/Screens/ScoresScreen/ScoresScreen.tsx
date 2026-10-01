import { Stack, Screen, Text } from '@/Design/Primitives';
import { Button, Card, ScoreRow, Timer } from '@/Design/Components';
import { Strings } from '@/Content';
import { ScoreEntry } from '../Types';

export interface ScoresScreenProps {
  remainingMs: number;
  totalMs: number;
  scores: readonly ScoreEntry[];
  isHost: boolean;
  onNext: () => void;
}

/** Round results, plus a manual Next for the host. */
export function ScoresScreen({
  remainingMs,
  totalMs,
  scores,
  isHost,
  onNext,
}: ScoresScreenProps) {
  return (
    <Screen>
      <Text variant="Title">{Strings.scores.headline}</Text>
      <Timer remainingMs={remainingMs} totalMs={totalMs} />
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
      {isHost ? (
        <Button variant="Primary" size="Large" onClick={onNext}>
          {Strings.scores.nextRound}
        </Button>
      ) : (
        <Text variant="Caption">{Strings.scores.waitingForHost}</Text>
      )}
    </Screen>
  );
}
