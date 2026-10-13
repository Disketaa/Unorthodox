import { vi } from 'vitest';

/** What a source node reports back, so a test can see how it was played. */
export interface Sounded {
  buffer: unknown;
  detune: { value: number };
  started: boolean;
  /** Whether the node repeats rather than stopping at the end of its buffer. */
  loop: boolean;
  /** The times a stop was asked for, in the context's own clock. Empty while it keeps going. */
  stoppedAt: number[];
  /** Whether the node was told to clean itself up once it ended. */
  cleanedUp: boolean;
}

/** One line of a gain's schedule, so a test can see what a fade was going to do and when. */
export interface Ramp {
  from: number;
  to: number;
  at: number;
}

/** What a gain node reports back: where it stands, and the ramps it has been given. */
export interface Faded {
  /** Where the gain is now, written through, so a test reads the level the page last set. */
  value: number;
  ramps: Ramp[];
}

/** A bus is a gain like any other; the name is only for reading a test that mixes them with the
 * levels under them. */
export type Bus = Faded;

/** The context's destination, standing in for the speakers. */
export const Speakers = { speakers: true };

export interface FakeAudio {
  sounded: Sounded[];
  decoded: string[];
  fetched: string[];
  resumed: number;
  /** Every gain the page has made: the buses that play through the speakers, and the ones each
   * note or track plays through them. Read after the play, since a gain is written after. */
  levels: Faded[];
  /** How far along the context's clock is, which is what a fade is measured against. */
  timeAt: () => number;
}

/** A context that records itself into one page-wide tally. The clock stands at zero and never
 * moves: a fade is measured against it, and a clock that ran would make every expected fade
 * time a race. */
function fakeContext(record: FakeAudio) {
  const now = 0;
  return class {
    state = 'suspended';
    destination = Speakers;
    get currentTime() {
      return now;
    }
    resume() {
      this.state = 'running';
      record.resumed += 1;
      return Promise.resolve();
    }
    createGain() {
      const made: Faded = { value: 0, ramps: [] };
      record.levels.push(made);
      return { gain: fakeParam(made), connect: () => undefined };
    }
    createBufferSource() {
      return recordingSource(record.sounded);
    }
    decodeAudioData(data: FakeBuffer) {
      record.decoded.push(data.data);
      return Promise.resolve(data);
    }
  };
}

/** The one gain parameter, written through to the tally. A scheduled value lands where it was
 * written, and a ramp is kept as the line it was rather than applied, so a test can read what
 * the page meant to do rather than what a clock would have done to it. */
function fakeParam(made: Faded) {
  return {
    get value() {
      return made.value;
    },
    set value(next: number) {
      made.value = next;
    },
    setValueAtTime: (value: number) => {
      made.value = value;
    },
    linearRampToValueAtTime: (value: number, at: number) => {
      made.ramps.push({ from: made.value, to: value, at });
    },
    cancelScheduledValues: () => undefined,
  };
}

/** A Web Audio context that records itself. happy-dom has no Web Audio, so the page's audio is
 * exercised against a stand-in that reports what it was asked to do: what was decoded, what was
 * started, and what any node looped, stopped or ramped. */
export function installFakeAudio(): FakeAudio {
  const record: FakeAudio = {
    sounded: [],
    decoded: [],
    fetched: [],
    resumed: 0,
    levels: [],
    timeAt: () => 0,
  };
  vi.stubGlobal('AudioContext', fakeContext(record));
  vi.stubGlobal('fetch', (url: string) => {
    record.fetched.push(url);
    return Promise.resolve({ arrayBuffer: () => Promise.resolve(new FakeBuffer(url)) });
  });
  return record;
}

class FakeBuffer {
  constructor(public data: string) {}
}

/** A source node that reports itself into the played list when it is created. */
function recordingSource(sounded: Sounded[]) {
  const node: Sounded = {
    buffer: undefined,
    detune: { value: 0 },
    started: false,
    loop: false,
    stoppedAt: [],
    cleanedUp: false,
  };
  sounded.push(node);
  return {
    get buffer() {
      return node.buffer;
    },
    set buffer(value: unknown) {
      node.buffer = value;
    },
    get loop() {
      return node.loop;
    },
    set loop(value: boolean) {
      node.loop = value;
    },
    detune: node.detune,
    set onended(handler: (() => void) | null) {
      node.cleanedUp = handler !== null;
    },
    get onended() {
      return null;
    },
    connect: () => undefined,
    start: () => {
      node.started = true;
    },
    stop: (when: number) => {
      node.stoppedAt.push(when);
    },
    disconnect: () => undefined,
  };
}
