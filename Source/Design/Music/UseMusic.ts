import { useEffect } from 'preact/hooks';
import { holdMusic } from './MusicBus';
import { duckMusic, playMusic, stopMusic, type MusicName } from './MusicBank';

/** Keeps the music in step with what is on screen. Nothing is stopped on the way out: two views
 * can share a track, and stopping between them fades one copy out and starts another over it. */
export function useMusic(track: MusicName, seconds?: number): void {
  useEffect(() => {
    playMusic(track, seconds);
  }, [track, seconds]);
}

/** Takes the music out of hearing for as long as the room is counting. The count-in is the pling
 * of each number, and a track under it is a track played over the one thing everybody is
 * waiting to hear. The track is not stopped, so the room is the same room a few seconds later. */
export function useDuckedMusic(ducked: boolean): void {
  useEffect(() => {
    duckMusic(ducked);
  }, [ducked]);
}

/** Takes the music out of hearing for as long as the room is held, and lets it back in at the
 * second it was at when the hold began. Asked of the room rather than of the track, since
 * holding is the room's fact and the track never stops playing through it. */
export function useHeldMusic(held: boolean): void {
  useEffect(() => {
    holdMusic(held);
  }, [held]);
}

/** Fades the music out for as long as `quiet` stands. The one place that asks for silence by
 * name, since every other screen either shares its track with the one before it or hands over
 * to another. */
export function useQuietMusic(quiet: boolean): void {
  useEffect(() => {
    if (quiet) stopMusic();
  }, [quiet]);
}
