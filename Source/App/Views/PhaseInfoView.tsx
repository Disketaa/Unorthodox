import { Character, Timer } from '@/Design/Components';
import { Stack } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { GameConfig } from '@/Game';
import { usePhaseAlarm } from '../Hooks/UsePhaseAlarm';
import type { PhaseViewProps } from './LobbyView';
import { clockOf, phaseInfo, useNoWinnerWash } from './PhaseInfoData';

export function PhaseInfoView({ view }: PhaseViewProps) {
  const clock = clockOf(view);
  const { deadline, ringing } = clock;
  usePhaseAlarm({ deadline, ringing, paused: view.paused });
  const info = phaseInfo(view, clock);
  useNoWinnerWash(info.noWinner);
  return (
    <Stack align="Center" gap="Sm">
      <Timer
        remainingMs={info.timerRemainingMs}
        totalMs={info.timerTotalMs}
        seconds={
          info.endgame && !info.counting ? '' : Strings.common.secondsLeft(info.secondsLeft)
        }
        badge={
          info.revealed && info.winnerLook !== undefined ? (
            <Character
              character={info.winnerLook.look.character}
              color={info.winnerLook.look.color}
              size="Medium"
            />
          ) : undefined
        }
        urgent={
          info.endgame ? false : info.timerRemainingMs <= GameConfig.timing.countdownUrgentMs
        }
        beatSemitones={info.beatSemitones}
        tint={info.tint}
      >
        {info.sentence}
      </Timer>
    </Stack>
  );
}
