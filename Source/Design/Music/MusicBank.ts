import menuUrl from './Jumpin June - The Soundlings.ogg';
import gameUrl from "./The Plan's Working - Cooper Cannell.ogg";
import votingUrl from './Hopeful - Nat Keefe.ogg';
import { audioContext, resumeAudio } from '../Audio/Context';
import { musicChannel } from './MusicToggle';

/** The three places the game can be in, rather than one per screen: the entry and the lobby
 * share a track, the round has its own, and the voting has a third, since that is the one phase
 * where everybody is reading the same board at once. */
export type MusicName = 'Menu' | 'Game' | 'Voting';

export const MusicNames: readonly MusicName[] = ['Menu', 'Game', 'Voting'];

const Sources: Record<MusicName, string> = {
  Menu: menuUrl,
  Game: gameUrl,
  Voting: votingUrl,
};

/** Per track, since the three are recorded at different loudnesses and the room's clips already
 * sit under the presses rather than beside them. Read once, at the fade, rather than per note. */
const Levels: Record<MusicName, number> = {
  Menu: 0.175,
  Game: 0.15,
  Voting: 0.075,
};

/** How long one track takes to hand the room to the next. A cut on the one step everybody plays
 * leaves a hole where the music was, and a hole reads as a gap in the page rather than as a
 * change of track. Long enough to hear as one piece becoming another. */
const CrossfadeSeconds = 1.5;

interface Track {
  name: MusicName;
  source: AudioBufferSourceNode;
  /** The fader for this track alone, since two tracks are audible at once during a fade. */
  fader: GainNode;
}

let bus: GainNode | undefined;
let current: Track | undefined;
const buffers = new Map<MusicName, AudioBuffer>();
const loading = new Map<MusicName, Promise<void>>();

/** The bus every track plays out through, made on the first ask and handed to the music's own
 * channel, so the switch beside the volume switch governs this and not the room's clips. */
function busFor(context: AudioContext): GainNode {
  if (bus) return bus;
  const made = context.createGain();
  made.connect(context.destination);
  bus = made;
  musicChannel.adopt(made);
  return made;
}

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
function startTrack(context: AudioContext, name: MusicName): Track | undefined {
  const buffer = buffers.get(name);
  if (!buffer) return undefined;
  // The bus is asked for before the fader, so the gains come out in the order a test reads them:
  // the bus every track goes through, then the fader for this one.
  const destination = busFor(context);
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const fader = context.createGain();
  fader.gain.value = 0;
  source.connect(fader);
  fader.connect(destination);
  source.start();
  return { name, source, fader };
}

/** Moves a fader to a level over the crossfade, from wherever it happens to be now. Written as a
 * ramp rather than a jump because the whole point is not to be a jump. */
function fade(context: AudioContext, fader: GainNode, level: number, seconds: number): void {
  const now = context.currentTime;
  fader.gain.setValueAtTime(fader.gain.value, now);
  fader.gain.linearRampToValueAtTime(level, now + seconds);
}

/** Hands the room to one track, fading the one under it out as the new one comes up. Asking for
 * the track already sounding changes nothing, or every re-render would restart the music as a
 * dip. `seconds` is the handover's length, so a change under a transition can finish with it. */
export function playMusic(name: MusicName, seconds: number = CrossfadeSeconds): void {
  if (current?.name === name) return;
  const context = audioContext();
  if (!context) return;
  resumeAudio();

  const starting = startTrack(context, name);
  if (!starting) {
    // Not decoded yet. The load runs to the end either way, and the ask is
    // remembered by the screen asking again on its next render.
    void loadMusic(name).then(() => {
      if (current?.name !== name) playMusic(name);
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
