import menuUrl from './Jumpin June - The Soundlings.ogg';
import gameUrl from "./The Plan's Working - Cooper Cannell.ogg";
import votingUrl from './Hopeful - Nat Keefe.ogg';
import winnerUrl from './Big Top - Sir Cubworth.ogg';
import { audioContext, resumeAudio } from '../Audio/Context';
import { fade, musicBusFor } from './MusicBus';

/** The three places the game can be in, rather than one per screen: the entry and the lobby
 * share a track, the round has its own, and the voting has a third, since that is the one phase
 * where everybody is reading the same board at once. */
export type MusicName = 'Menu' | 'Game' | 'Voting' | 'Winner';

export const MusicNames: readonly MusicName[] = ['Menu', 'Game', 'Voting', 'Winner'];

const Sources: Record<MusicName, string> = {
  Menu: menuUrl,
  Game: gameUrl,
  Voting: votingUrl,
  Winner: winnerUrl,
};

/** Per track, since the three are recorded at different loudnesses and the room's clips already
 * sit under the presses rather than beside them. Read once, at the fade, rather than per note. */
const Levels: Record<MusicName, number> = {
  Menu: 0.175,
  Game: 0.15,
  Voting: 0.075,
  Winner: 0.125,
};

/** How long one track takes to hand the room to the next. A cut on the one step everybody plays
 * leaves a hole where the music was, and a hole reads as a gap in the page rather than as a
 * change of track. Long enough to hear as one piece becoming another. */
const CrossfadeSeconds = 1.5;

/** How fast a track goes quiet for something said over it, and how long that takes. All the way
 * down, since the count-in is the pling of each number and a track audible under it is a track
 * played over the one thing in the game everybody is waiting to hear. */
const DuckFadeSeconds = 0.4;

interface Track {
  name: MusicName;
  source: AudioBufferSourceNode;
  /** The fader for this track alone, since two tracks are audible at once during a fade. */
  fader: GainNode;
  /** This track's own duck, behind its fader. One per track rather than one on the bus, since a
   * duck is about the track being talked over: a duck let go on the bus at the moment the lobby
   * hands over to the round would swell the very track that is on its way out. */
  duck: GainNode;
}

let current: Track | undefined;
const buffers = new Map<MusicName, AudioBuffer>();
const loading = new Map<MusicName, Promise<void>>();

/** Decodes one track, at most once, however many callers ask at the same time. */
function loadMusic(name: MusicName): Promise<void> {
  const ready = loading.get(name);
  if (ready) return ready;
  const context = audioContext();
  if (!context) return Promise.resolve();
  const pending = fetch(Sources[name])
    .then((response) => response.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      loading.delete(name);
    })
    .catch(() => {
      // A track that will not load is not worth failing a screen over; the screen is
      // playable without it and nobody asked for music by name.
      loading.delete(name);
    });
  loading.set(name, pending);
  return pending;
}

/** Starts one looping voice of the track at silence, ready to be faded up. Nothing is returned
 * where the track has not been decoded yet, since starting it later is the caller's decision. */
function startTrack(context: AudioContext, name: MusicName, loop: boolean): Track | undefined {
  const buffer = buffers.get(name);
  if (!buffer) return undefined;
  // The bus is asked for before the fader, so the gains come out in the order a test reads them:
  // the bus, then the hold, then this track's fader, then its duck.
  const destination = musicBusFor(context);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  const fader = context.createGain();
  fader.gain.value = 0;
  const duck = context.createGain();
  duck.gain.value = 1;
  source.connect(fader);
  fader.connect(duck);
  duck.connect(destination);
  source.start();
  return { name, source, fader, duck };
}

/** Takes the music out of hearing while something is said over it, and brings the same track
 * back when the saying stops. The track is not stopped, so the room is the same room
 * afterwards. Which track is ducked is settled by which is playing when this arrives. */
export function duckMusic(next: boolean): void {
  const context = audioContext();
  const made = current?.duck;
  if (!context || !made) return;
  fade(context, made, next ? 0 : 1, DuckFadeSeconds);
}

/** Hands the room to one track, fading the one under it out. Asking for the track already
 * sounding changes nothing. `seconds` is the handover's length; `loop` decides whether it
 * repeats. */
export function playMusic(
  name: MusicName,
  seconds: number = CrossfadeSeconds,
  loop: boolean = true
): void {
  if (current?.name === name) return;
  const context = audioContext();
  if (!context) return;
  resumeAudio();

  const starting = startTrack(context, name, loop);
  if (!starting) {
    // Not decoded yet. The load runs to the end either way, and the ask is
    // remembered by the screen asking again on its next render.
    void loadMusic(name).then(() => {
      if (current?.name !== name) playMusic(name, seconds, loop);
    });
    return;
  }

  const outgoing = current;
  current = starting;
  fade(context, starting.fader, Levels[name], seconds);
  if (outgoing) {
    fade(context, outgoing.fader, 0, seconds);
    // Stopped at the time the ramp ends rather than at once, so the old track is
    // faded rather than cut, and left to tidy itself up when it does end.
    outgoing.source.stop(context.currentTime + seconds);
    outgoing.source.onended = () => {
      outgoing.source.disconnect();
      outgoing.fader.disconnect();
    };
  }
}

/** Fades the room out of the music and lets it go. Said in as many words by whoever means it: a
 * view going off the screen is not enough, since the next view may be asking for the track this
 * one is leaving rather than for silence. */
export function stopMusic(): void {
  const context = audioContext();
  const outgoing = current;
  if (!context || !outgoing) return;
  current = undefined;
  fade(context, outgoing.fader, 0, CrossfadeSeconds);
  outgoing.source.stop(context.currentTime + CrossfadeSeconds);
  outgoing.source.onended = () => {
    outgoing.source.disconnect();
    outgoing.fader.disconnect();
  };
}

/** Fetches and decodes the tracks, so the first scene asking for music is not waiting on the
 * network. Called once at start-up for the same reason the clips are: the fetch is the slow
 * part, and nothing is heard until a gesture wakes the context anyway. */
export function preloadMusic(names: readonly MusicName[] = MusicNames): Promise<void[]> {
  if (!audioContext()) return Promise.resolve([]);
  return Promise.all(
    names.map((name) => (buffers.has(name) ? Promise.resolve() : loadMusic(name)))
  );
}
