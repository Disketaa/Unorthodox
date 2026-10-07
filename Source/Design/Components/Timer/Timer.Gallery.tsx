import { Timer } from './Timer';
import { Stack, Text } from '@/Design/Primitives';

export function TimerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Timer</Text>
      <Timer remainingMs={60_000} totalMs={60_000} seconds="60">
        Соня выбирает тему…
      </Timer>
      <Timer remainingMs={30_000} totalMs={60_000} seconds="30" tint="#e0559a">
        Соня выбирает тему…
      </Timer>
      <Timer
        remainingMs={4_000}
        totalMs={60_000}
        seconds="4"
        urgent
        tint="#8a7ae0"
        beatSemitones={1}
      >
        Все пишут ответы…
      </Timer>
      <Timer remainingMs={1_000} totalMs={60_000} seconds="1">
        Голосуем за ответы…
      </Timer>
    </Stack>
  );
}
