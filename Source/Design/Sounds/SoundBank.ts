import { type SoundName, SoundNames, Sources, Volumes, PitchSpreads } from './SoundClips';
import { audioContext, resumeAudio } from '../Audio/Context';
import { muteBus } from './Mute';

export { SoundNames } from './SoundClips';
export type { SoundName } from './SoundClips';

interface Voice {
  context: AudioContext;
  bus: GainNode;
}

let voice: Voice | undefined;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<void>>();

/** The bus every note goes out through, made on the first ask and then the same bus for the rest
 * of the page. The context behind it is shared with the music, so one gesture wakes both. */
function voiceFor(): Voice | undefined {
  if (voice) return voice;
  const context = audioContext();
  if (!context) return undefined;
  const bus = context.createGain();
  bus.connect(context.destination);
  voice = { context, bus };
  muteBus(bus);
  return voice;
}

/** Decodes one clip, at most once, however many callers ask at the same time. Two presses
 * landing while the first fetch is open share one promise, so a clip is never requested twice
 * and neither press plays before its decode has finished. */
function loadSound(name: SoundName): Promise<void> {
  const ready = loading.get(name);
  if (ready) return ready;
  const context = voiceFor()?.context;
  if (!context) return Promise.resolve();
  const pending = fetch(Sources[name])
    .then((response) => response.arrayBuffer())
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      loading.delete(name);
    })
    .catch(() => {
      // A clip that will not load is not worth breaking a press over; the press
      // itself has already happened and the interface does not wait on audio.
      loading.delete(name);
    });
  loading.set(name, pending);
  return pending;
}

/** Starts one voice from the decoded clip and throws it away when it ends. The buffer is shared
 * and cannot be replayed, so every press needs its own source node, and a node that is not
 * stopped keeps the graph alive for as long as the clip is. */
function speak(
  context: AudioContext,
  destination: AudioNode,
  name: SoundName,
  semitones?: number
): void {
  const buffer = buffers.get(name);
  if (!buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const spread = PitchSpreads[name];
  const detune = semitones ?? (Math.random() * 2 - 1) * spread;
  source.detune.value = detune * 100;
  // A gain per note, not one for the bank, since the clips differ in loudness and that is a
  // property of the clip. Made even where it is 1, so every note has the same shape of path.
  const level = context.createGain();
  level.gain.value = Volumes[name];
  source.connect(level);
  level.connect(destination);
  source.onended = () => {
    source.disconnect();
    level.disconnect();
  };
  source.start();
}

/** Fetches and decodes the clips, so the first press is not waiting on the network. Called once
 * at start-up rather than on the first press, so the buffer is already in memory by the time
 * anyone presses anything. Sounds already held are left alone, so this is safe to repeat. */
export function preloadSounds(names: readonly SoundName[] = SoundNames): Promise<void[]> {
  const context = audioContext();
  if (!context) return Promise.resolve([]);
  return Promise.all(
    names.map((name) => {
      if (buffers.has(name)) return Promise.resolve();
      // The context opens suspended and stays that way until a gesture, so the decode happens
      // against a context not yet allowed to make a sound. That is the point: the fetch is the
      // slow part, and it happens before anyone can press anything.
      return loadSound(name);
    })
  );
}

/** One press, one note. Silent where there is no Web Audio: a sound is an addition to a press,
 * never a condition of it. `semitones` asks for one exact pitch, because a run of wobbling
 * presses cannot be put in order. */
export function playSound(name: SoundName, semitones?: number): void {
  const played = voiceFor();
  if (!played) return;
  const { context, bus } = played;
  // A press is a gesture too, so this is the fallback for a page that was
  // pressed without the preload having armed anything.
  resumeAudio();
  if (buffers.has(name)) {
    speak(context, bus, name, semitones);
    return;
  }
  // The first press of a clip is early enough to catch its own load; the decode
  // runs to the end either way, so the next press is never waiting.
  void loadSound(name).then(() => speak(context, bus, name, semitones));
}
