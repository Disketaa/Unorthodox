import { Stack, Text } from '@/Design/Primitives';
import { Leaderboard, type LeaderboardRow } from './Leaderboard';

/** The rooms the gallery shows the leaderboard in: a full table of players, where two of the
 * places overtake another as the round is paid and one is paid nothing at all. */
const rows: LeaderboardRow[] = [
  {
    id: 'p0',
    name: 'Anya',
    character: 'Butterfly',
    color: 'Coral',
    score: 42,
    round: 2,
    rank: 1,
    isSelf: true,
  },
  {
    id: 'p1',
    name: 'Berenice',
    character: 'Ghost',
    color: 'Sky',
    score: 31,
    round: 20,
    rank: 2,
  },
  {
    id: 'p2',
    name: 'Maximiliana',
    character: 'Daisy',
    color: 'Mint',
    score: 28,
    round: 1,
    rank: 3,
  },
  {
    id: 'p3',
    name: 'Tobias',
    character: 'Star',
    color: 'Violet',
    score: 17,
    round: 12,
    rank: 4,
  },
  { id: 'p4', name: 'Konstantin', character: 'Hat', color: 'Rose', score: 9, rank: 5 },
  { id: 'p5', name: 'Ursula', character: 'Heart', color: 'Amber', score: 4, round: 4, rank: 6 },
];

export function LeaderboardGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Leaderboard</Text>
      <Leaderboard rows={rows} />
    </Stack>
  );
}
