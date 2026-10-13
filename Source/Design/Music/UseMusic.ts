import { useEffect } from 'preact/hooks';
import { playMusic, stopMusic, type MusicName } from './MusicBank';

/** Keeps the music in step with what is on screen. Nothing is stopped on the way out: two views
 * can share a track, and stopping between them fades one copy out and starts another over it. */
export function useMusic(track: MusicName, seconds?: number): void {
  useEffect(() => {
    playMusic(track, seconds);
  }, [track, seconds]);
}

/** Fades the music out for as long as `quiet` stands. The one place that asks for silence by
 * name, since every other screen either shares its track with the one before it or hands over
 * to another. */
export function useQuietMusic(quiet: boolean): void {
  useEffect(() => {
    if (quiet) stopMusic();
  }, [quiet]);
}
