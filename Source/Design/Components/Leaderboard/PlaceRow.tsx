import { useSwayMotion } from '@/Design/Primitives';
import { useStanding } from './LeaderboardShow';
import { PlaceRowBody } from './PlaceRowBody';
import type { LeaderboardRow } from './Leaderboard';

export interface PlaceRowProps {
  row: LeaderboardRow;
  at: number;
  delay: number;
  top: number;
  stage: import('./LeaderboardShow').ShowStage;
  countMs: number;
  silent: boolean;
  paused: boolean;
  run: number;
}

export function PlaceRow({
  row,
  at,
  delay,
  top,
  stage,
  countMs,
  silent,
  paused,
  run,
}: PlaceRowProps) {
  const sway = useSwayMotion<HTMLLIElement>();
  const value = useStanding({ row, stage, countMs, silent, paused, run });
  const round = row.round ?? 0;
  const share = top > 0 ? value / top : 0;
  const showsRound = stage !== 'Arrived' && round > 0;
  const counting = stage === 'Counting' && round > 0;
  const idle = stage !== 'Arrived';
  return (
    <PlaceRowBody
      row={row}
      at={at}
      delay={delay}
      share={share}
      showsRound={showsRound}
      round={round}
      value={value}
      sway={sway}
      counting={counting}
      idle={idle}
      paused={paused}
    />
  );
}
