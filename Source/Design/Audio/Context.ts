let context: AudioContext | undefined;
let armed = false;

/** The one audio context everything plays out through, made on the first ask. Two contexts drift
 * against each other's clocks within seconds, so a sound and the music under it have to share
 * one, and one gesture then wakes both. */
export function audioContext(): AudioContext | undefined {
  if (context) return context;
  if (typeof AudioContext === 'undefined') return undefined;
  context = new AudioContext();
  wakeOnFirstGesture(context);
  return context;
}

/** Wakes the context on the first gesture anywhere, not on the first press. The browser spends
 * its first moments after a gesture bringing up an audio thread, so a press paying for that was
 * audibly late: the button moved and the pop arrived afterwards. */
function wakeOnFirstGesture(opened: AudioContext): void {
  if (armed || typeof window === 'undefined') return;
  armed = true;
  const wake = () => {
    if (opened.state === 'suspended') void opened.resume();
    window.removeEventListener('pointerdown', wake);
    window.removeEventListener('keydown', wake);
  };
  window.addEventListener('pointerdown', wake);
  window.addEventListener('keydown', wake);
}

/** Wakes the context now, where it can. A press is a gesture, so this is the fallback for a
 * gesture that arrived without the arming having heard it. */
export function resumeAudio(): void {
  const opened = audioContext();
  if (opened && opened.state === 'suspended') void opened.resume();
}
