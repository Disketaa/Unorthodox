import type { ToggleStorage } from './ToggleStorage';

/** One thing that can be heard or not, and the gain node its sound goes out through. Each of the
 * game's two channels holds its own flag and its own node, which is why either can be switched
 * off without being asked about the other. */
export interface Channel {
  /** Whether this channel is on. The flag is the source of truth; the gain follows it. */
  enabled(): boolean;
  /** Turns the channel on or off, remembers it, and tells the gain to follow. A choice made
   * before anything adopted a node still counts, since the node comes later. */
  setEnabled(on: boolean): void;
  /** Hands the channel the gain node it governs, at the level the flag and the tab's visibility
   * ask for. Cut on the node rather than by refusing to play, since what is already sounding
   * has to be cut too. */
  adopt(node: GainNode): void;
}

/** Every channel's gain, so the tab's visibility is watched once rather than once per channel. */
const followers = new Set<() => void>();
let watching = false;

/** Builds a channel over one stored choice. The storage is injected rather than built here, so
 * the two channels in this game differ only in their key and their default. */
export function makeChannel(storage: ToggleStorage): Channel {
  let on = storage.load();
  let node: GainNode | undefined;

  const apply = () => {
    if (node) node.gain.value = gainFor();
  };
  const gainFor = () => (on && !hidden() ? 1 : 0);

  followers.add(apply);
  if (typeof document !== 'undefined' && !watching) {
    watching = true;
    document.addEventListener('visibilitychange', () =>
      followers.forEach((follow) => follow())
    );
  }

  return {
    enabled: () => on,
    setEnabled: (next: boolean) => {
      on = next;
      storage.save(next);
      apply();
    },
    adopt: (adopted: GainNode) => {
      node = adopted;
      apply();
    },
  };
}

/** One place decides, so a hidden tab cannot drag a channel back on after its switch is off. */
function hidden(): boolean {
  return typeof document !== 'undefined' && document.hidden;
}
