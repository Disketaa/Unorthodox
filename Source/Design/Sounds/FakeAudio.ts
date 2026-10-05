import { vi } from 'vitest';

/** What a source node reports back, so a test can see how it was played. */
export interface Sounded {
  buffer: unknown;
  detune: { value: number };
  started: boolean;
}

export interface FakeAudio {
  sounded: Sounded[];
  decoded: string[];
  fetched: string[];
  resumed: number;
}

/** A Web Audio context that records itself. happy-dom has no Web Audio, so the bank is exercised
 * against a stand-in that reports what it was asked to do: which clip was decoded, how many
 * times a node was started, and the detune it was played at. */
export function installFakeAudio(): FakeAudio {
  const record: FakeAudio = { sounded: [], decoded: [], fetched: [], resumed: 0 };

  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'suspended';
      destination = {};
      resume() {
        this.state = 'running';
        record.resumed += 1;
        return Promise.resolve();
      }
      createGain() {
        return { gain: { value: 0 }, connect: () => undefined };
      }
      createBufferSource() {
        return recordingSource(record.sounded);
      }
      decodeAudioData(data: FakeBuffer) {
        record.decoded.push(data.data);
        return Promise.resolve(data);
      }
    },
  );
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
  const node: Sounded = { buffer: undefined, detune: { value: 0 }, started: false };
  sounded.push(node);
  return {
    get buffer() {
      return node.buffer;
    },
    set buffer(value: unknown) {
      node.buffer = value;
    },
    detune: node.detune,
    onended: null,
    connect: () => undefined,
    start: () => {
      node.started = true;
    },
    disconnect: () => undefined,
  };
}