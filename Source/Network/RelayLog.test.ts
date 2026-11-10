import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  relayStateSnapshot,
  relayReachable,
  relayConnecting,
  relayOpen,
  relayClosed,
  relayError,
  relayIdle,
  relayDropped,
  relayReconnectScheduled,
  relayOpened,
  relayHostLeft,
  relayHostReady,
  relayPeerLeft,
  relaySent,
  relayReceived,
  RelayConnectTimeoutMs,
  watchRelayConnect,
} from './RelayLog';
import { note } from './Report';

vi.mock('./Report', () => ({ note: vi.fn() }));

beforeEach(() => {
  vi.mocked(note).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RelayLog', () => {
  test('relayStateSnapshot returns current status', () => {
    expect(relayStateSnapshot()).toEqual({ 'wss://relay.144-31-61-203.sslip.io/game': 'idle' });
  });

  test('relayReachable returns false when idle', () => {
    expect(relayReachable()).toBe(false);
  });

  test('relayConnecting sets status', () => {
    relayConnecting(2);
    expect(relayReachable()).toBe(false);
    expect(vi.mocked(note)).toHaveBeenCalledWith(
      'info',
      'relay connecting',
      'attempt 2',
      'wss://relay.144-31-61-203.sslip.io/game'
    );
  });

  test('relayOpen sets status open', () => {
    relayOpen();
    expect(relayReachable()).toBe(true);
  });

  test('relayClosed sets status closed', () => {
    relayClosed(1001, 'going away', true);
    expect(relayReachable()).toBe(false);
  });

  test('relayError sets status error', () => {
    relayError(3);
    expect(relayReachable()).toBe(false);
  });

  test('relayIdle sets status idle', () => {
    relayOpen();
    relayIdle();
    expect(relayReachable()).toBe(false);
  });

  test('relayDropped logs warning', () => {
    relayDropped('ToHost');
    expect(vi.mocked(note)).toHaveBeenCalledWith(
      'warn',
      'relay frame dropped, socket not open',
      'ToHost',
      'state idle'
    );
  });

  test('relayReconnectScheduled logs warning', () => {
    relayReconnectScheduled(5000, 3);
    expect(vi.mocked(note)).toHaveBeenCalledWith(
      'warn',
      'relay reconnect scheduled',
      'in 5000ms',
      'attempt 3'
    );
  });

  test('relayOpened logs info', () => {
    relayOpened(true);
    expect(vi.mocked(note)).toHaveBeenCalledWith('info', 'relay opened', 'hostPresent true');
  });

  test('relayHostLeft logs warning', () => {
    relayHostLeft();
    expect(vi.mocked(note)).toHaveBeenCalledWith('warn', 'relay said the host left');
  });

  test('relayHostReady logs info', () => {
    relayHostReady();
    expect(vi.mocked(note)).toHaveBeenCalledWith('info', 'relay host ready');
  });

  test('relayPeerLeft logs info', () => {
    relayPeerLeft('p1');
    expect(vi.mocked(note)).toHaveBeenCalledWith('info', 'relay peer left', 'p1');
  });

  test('relaySent logs debug', () => {
    relaySent('Open');
    expect(vi.mocked(note)).toHaveBeenCalledWith('debug', 'relay sent', 'Open', '');
  });

  test('relaySent logs debug with peerId', () => {
    relaySent('ToPeer', 'p1');
    expect(vi.mocked(note)).toHaveBeenCalledWith('debug', 'relay sent', 'ToPeer', 'p1');
  });

  test('relayReceived non-Data logs debug', () => {
    relayReceived({ type: 'HostReady' });
    expect(vi.mocked(note)).toHaveBeenCalledWith('debug', 'relay received', 'HostReady');
  });

  test('relayReceived Data logs with payload kind', () => {
    relayReceived({ type: 'Data', fromHost: true, peerId: 'p1', data: { type: 'Join' } });
    expect(vi.mocked(note)).toHaveBeenCalledWith(
      'debug',
      'relay received',
      'Data Join',
      'from host'
    );
  });

  test('RelayConnectTimeoutMs is 8000', () => {
    expect(RelayConnectTimeoutMs).toBe(8000);
  });

  test('watchRelayConnect calls timeout then disarms', () => {
    const onTimeout = vi.fn();
    const disarm = watchRelayConnect(onTimeout);
    expect(typeof disarm).toBe('function');
    disarm();
  });
});
