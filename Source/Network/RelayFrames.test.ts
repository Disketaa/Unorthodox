import { describe, test, expect } from 'vitest';
import { dispatchFrame } from './RelayFrames';
import type { FrameSink } from './RelayFrames';

describe('dispatchFrame', () => {
  test('dispatches Opened', () => {
    const calls: string[] = [];
    const sink: FrameSink = {
      opened: (hostPresent) => calls.push(`opened ${hostPresent}`),
      hostReady: () => calls.push('hostReady'),
      peerLeft: (id) => calls.push(`peerLeft ${id}`),
      hostLeft: () => calls.push('hostLeft'),
      data: (data, fromHost, peerId) => calls.push(`data ${data} ${fromHost} ${peerId}`),
    };
    dispatchFrame({ type: 'Opened', peerId: 'p1', hostPresent: true }, sink);
    expect(calls).toEqual(['opened true']);
  });

  test('dispatches HostReady', () => {
    const calls: string[] = [];
    const sink: FrameSink = {
      opened: () => calls.push('opened'),
      hostReady: () => calls.push('hostReady'),
      peerLeft: () => calls.push('peerLeft'),
      hostLeft: () => calls.push('hostLeft'),
      data: () => calls.push('data'),
    };
    dispatchFrame({ type: 'HostReady' }, sink);
    expect(calls).toEqual(['hostReady']);
  });

  test('dispatches PeerLeft', () => {
    const calls: string[] = [];
    const sink: FrameSink = {
      opened: () => calls.push('opened'),
      hostReady: () => calls.push('hostReady'),
      peerLeft: (id) => calls.push(`peerLeft ${id}`),
      hostLeft: () => calls.push('hostLeft'),
      data: () => calls.push('data'),
    };
    dispatchFrame({ type: 'PeerLeft', peerId: 'p2' }, sink);
    expect(calls).toEqual(['peerLeft p2']);
  });

  test('dispatches HostLeft', () => {
    const calls: string[] = [];
    const sink: FrameSink = {
      opened: () => calls.push('opened'),
      hostReady: () => calls.push('hostReady'),
      peerLeft: () => calls.push('peerLeft'),
      hostLeft: () => calls.push('hostLeft'),
      data: () => calls.push('data'),
    };
    dispatchFrame({ type: 'HostLeft' }, sink);
    expect(calls).toEqual(['hostLeft']);
  });

  test('dispatches Data', () => {
    const calls: string[] = [];
    const sink: FrameSink = {
      opened: () => calls.push('opened'),
      hostReady: () => calls.push('hostReady'),
      peerLeft: () => calls.push('peerLeft'),
      hostLeft: () => calls.push('hostLeft'),
      data: (data, fromHost, peerId) => calls.push(`data ${data} ${fromHost} ${peerId}`),
    };
    dispatchFrame({ type: 'Data', fromHost: true, peerId: 'p3', data: { x: 1 } }, sink);
    expect(calls).toEqual(['data [object Object] true p3']);
  });
});
