import plingUrl from './Pling.ogg';
import popUrl from './Pop.ogg';

export type SoundName = 'Pop' | 'Pling';

export const SoundNames: readonly SoundName[] = ['Pop', 'Pling'];

const Sources: Record<SoundName, string> = {
  Pop: popUrl,
  Pling: plingUrl,
};

const Volume = 0.3;

/**
 * How far either side of the recorded pitch a press may land, in semitones.
 *
 * Wide enough that two presses in a row are two notes rather than one note
 * wobbling, which was the point: at a few per cent nobody could hear a
 * difference at all. Narrower than the fifth it started at, because a fifth
 * stopped reading as the same clip and started reading as a deliberate joke on
 * every press. A major third is the compromise that is still two notes.
 *
 * Detuning keeps the clip's own length, so a shift this size costs no time.
 */
const PitchSpread = 2.5;

interface Voice {
  context: AudioContext;
  gain: GainNode;
}

let voice: Voice | undefined;
let armed = false;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<void>>();

/**
 * Wakes the context on the first gesture anywhere, not on the first press.
 *
 * A context only starts running inside a user gesture, and the browser spends
 * its first moments afterwards bringing up an audio thread that did not exist
 * before. A press that had to pay for both was audibly late: the button moved,
 * and the pop arrived afterwards. Any pointer or key press anywhere in the page
 * is the same gesture to the browser and usually happens first, so the thread is
 * already up by the time anything is actually pressed.
 *
 * Listeners are attached only while suspended and removed as soon as one lands,
 * so a page that is never touched holds nothing.
 */
function wakeOnFirstGesture(context: AudioContext): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const wake = () => {
    if (context.state === 'suspended') void context.resume();
    window.removeEventListener('pointerdown', wake);
    window.removeEventListener('keydown', wake);
  };
  window.addEventListener('pointerdown', wake);
  window.addEventListener('keydown', wake);
}

/**
 * The context and its one gain, created on the first ask.
 *
 * The context is allowed to exist suspended: it is a legal state before any
 * gesture and it is what lets the clips be fetched and decoded at load time,
 * which is the whole reason this is not an `Audio` element per clip.
 */
function voiceFor(): Voice | undefined {
  if (voice) return voice;
  if (typeof AudioContext === 'undefined') return undefined;
  const context = new AudioContext();
  const gain = context.createGain();
  gain.gain.value = Volume;
  gain.connect(context.destination);
  voice = { context, gain };
  return voice;
}

/**
 * Decodes one clip, at most once, however many callers ask at the same time.
 *
 * Two presses landing while the first fetch is still open share the same
 * promise, so a clip is never requested twice and neither press plays before the
 * decode it is waiting on has finished.
 */
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

/**
 * Starts one voice from the decoded clip and throws it away when it ends.
 *
 * The buffer is shared and cannot be replayed, so every press needs its own
 * source node, and a node that is not stopped keeps the graph alive for as long
 * as the clip is.
 *
 * A named pitch replaces the random spread rather than adding to it: a clip asked
 * for at a pitch is asking for that note, and a note that also wobbles by a couple
 * of semitones is not the note anybody asked for.
 */
function speak(context: AudioContext, gain: GainNode, name: SoundName, semitones?: number): void {
  const buffer = buffers.get(name);
  if (!buffer) return;
  const source = context.createBufferSource();
  source.buffer = buffer;
  const detune = semitones ?? (Math.random() * 2 - 1) * PitchSpread;
  source.detune.value = detune * 100;
  source.connect(gain);
  source.onended = () => source.disconnect();
  source.start();
}

/**
 * Fetches and decodes the clips, so the first press is not waiting on the network.
 *
 * Called once at start-up rather than on the first press: at that point the
 * context is still suspended, which is fine, and by the time anyone presses
 * anything the buffer is already in memory and the sound starts on the click.
 * Sounds already held are left alone, so this is safe to call again.
 */
export function preloadSounds(names: readonly SoundName[] = SoundNames): Promise<void[]> {
  const context = voiceFor()?.context;
  if (!context) return Promise.resolve([]);
  wakeOnFirstGesture(context);
  return Promise.all(
    names.map((name) => {
      if (buffers.has(name)) return Promise.resolve();
      // The context opens suspended and stays that way until a gesture, so the
      // decode is done here against a context that is not yet allowed to make a
      // sound. That is the point: the fetch is the slow part, and it happens
      // before anyone can press anything.
      return loadSound(name);
    }),
  );
}

/**
 * One press, one note.
 *
 * Silent where there is no Web Audio to play through, which is every environment
 * without it rather than a browser this is aiming at. A sound is an addition to a
 * press, never a condition of it.
 *
 * `semitones` asks for one exact pitch instead of a press at whatever the clip's own
 * pitch is: the count-in needs its three notes to be three notes, and a run of
 * presses that each wobble is a run of notes nobody can put in order.
 */
export function playSound(name: SoundName, semitones?: number): void {
  const played = voiceFor();
  if (!played) return;
  const { context, gain } = played;
  // A press is a gesture too, so this is the fallback for a page that was
  // pressed without the preload having armed anything.
  if (context.state === 'suspended') void context.resume();
  if (buffers.has(name)) {
    speak(context, gain, name, semitones);
    return;
  }
  // The first press of a clip is early enough to catch its own load; the decode
  // runs to the end either way, so the next press is never waiting.
  void loadSound(name).then(() => speak(context, gain, name, semitones));
}