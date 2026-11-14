import { Strings } from '@/Content';
import { Button } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import type { ScoringMode } from '@/Game';

const scoringModes: readonly ScoringMode[] = ['Smart', 'Simple'];

export interface ScoringChoicesProps {
  scoringMode: ScoringMode;
  isHost: boolean;
  onPick: (scoringMode: ScoringMode) => void;
}

export function ScoringChoices({ scoringMode, isHost, onPick }: ScoringChoicesProps) {
  return (
    <Stack direction="Horizontal" gap="Sm" align="Stretch" fill="Even">
      {scoringModes.map((option) => (
        <Button
          key={option}
          variant={option === scoringMode ? 'Primary' : 'Muted'}
          disabled={!isHost}
          onClick={() => onPick(option)}
        >
          {Strings.lobby.settings.scoringModes[option]}
        </Button>
      ))}
    </Stack>
  );
}
