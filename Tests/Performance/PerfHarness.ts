import { HostSession, InMemoryTransport, ClientSession } from '@/Network';
import type { MemorySnapshot, PerfResult, TimedOp } from '../../Tools/Performance/types';
import { takeSnapshot } from './MemorySnapshot';
import { percentile } from '../../Tools/Performance/Percentile';

/** One round's worth of timed operations. */
interface RoundTimings {
  readonly startWritingMs: number;
  readonly submitAnswersMs: number;
  readonly endReviewingMs: number;
  readonly nextRoundMs: number;
}

/** Time one operation and return its duration in milliseconds. */
function timeOp(work: () => void): number {
  const start = performance.now();
  work();
  return performance.now() - start;
}

/** Have every client submit an answer, then the host submits its own. Times each submit. */
function submitAllAnswers(
  host: HostSession,
  clients: readonly ClientSession[]
): { totalMs: number; submittedCount: number } {
  let total = 0;
  let count = 0;
  for (const client of clients) {
    total += timeOp(() => client.submitAnswer(`answer from ${client.getPlayerId()}`));
    count += 1;
  }
  total += timeOp(() => host.submitOwnAnswer('answer from host'));
  count += 1;
  return { totalMs: total, submittedCount: count };
}

/** Play one round and time each step, asserting the phase advances correctly. */
function playRound(
  host: HostSession,
  clients: readonly ClientSession[],
  topic: string
): RoundTimings & { submittedCount: number } {
  const startWritingMs = timeOp(() => host.startWriting(topic));
  const stateAfterWriting = host.getState();
  if (stateAfterWriting === undefined || stateAfterWriting.phase !== 'Writing') {
    throw new Error(`expected Writing after startWriting, got ${stateAfterWriting?.phase}`);
  }

  const { totalMs: submitAnswersMs, submittedCount } = submitAllAnswers(host, clients);

  const endReviewingMs = timeOp(() => host.endReviewing());
  const stateAfterReview = host.getState();
  if (stateAfterReview === undefined || stateAfterReview.phase !== 'Reviewing') {
    throw new Error(`expected Reviewing after endReviewing, got ${stateAfterReview?.phase}`);
  }

  const nextRoundMs = timeOp(() => host.nextRound());
  const stateAfterNext = host.getState();
  if (stateAfterNext === undefined || stateAfterNext.phase !== 'Choosing') {
    throw new Error(`expected Choosing after nextRound, got ${stateAfterNext?.phase}`);
  }

  return { startWritingMs, submitAnswersMs, endReviewingMs, nextRoundMs, submittedCount };
}

/** Create one client session and have it join the room. */
function createClient(roomCode: string, index: number): ClientSession {
  const transport = new InMemoryTransport();
  const session = new ClientSession(transport);
  session.start(roomCode, `player${index}`);
  session.join(`player${index}`, { character: 'Butterfly', color: 'Coral' });
  return session;
}

/** Run a full game simulation and return timing and memory data. */
export function runGameSession(
  roomCode: string,
  playerCount: number,
  roundCount: number
): PerfResult {
  const ops: TimedOp[] = [];
  const snapshots: MemorySnapshot[] = [];

  const hostTransport = new InMemoryTransport();
  const host = new HostSession(hostTransport);
  host.start(roomCode, 'host', { character: 'Butterfly', color: 'Coral' });

  const clients: ClientSession[] = [];
  for (let index = 0; index < playerCount - 1; index += 1) {
    clients.push(createClient(roomCode, index));
  }

  snapshots.push(takeSnapshot());

  const startGameMs = timeOp(() => host.startGame());
  ops.push({ name: 'startGame', ms: startGameMs });

  let totalSubmitted = 0;
  for (let round = 0; round < roundCount; round += 1) {
    const topic = `topic ${round}`;
    const timings = playRound(host, clients, topic);
    ops.push({ name: 'startWriting', ms: timings.startWritingMs });
    ops.push({ name: 'submitAnswers', ms: timings.submitAnswersMs });
    ops.push({ name: 'endReviewing', ms: timings.endReviewingMs });
    ops.push({ name: 'nextRound', ms: timings.nextRoundMs });
    totalSubmitted += timings.submittedCount;
    snapshots.push(takeSnapshot());
  }

  try {
    ops.push({ name: 'stop', ms: timeOp(() => {
      host.stop();
      for (const client of clients) {
        client.stop();
      }
    }) });
  } finally {
    assertNoPeerLeak();
  }

  let totalMs = 0;
  let slowest: TimedOp | undefined = undefined;
  for (const op of ops) {
    totalMs += op.ms;
    if (slowest === undefined || op.ms > slowest.ms) slowest = op;
  }

  return {
    rounds: roundCount,
    players: playerCount,
    ops,
    snapshots,
    slowestOp: slowest,
    totalMs,
    submittedCount: totalSubmitted,
  };
}

/** Run the same game config N times and return the p95 of total time. */
export function runGameSessionP95(
  roomCode: string,
  playerCount: number,
  roundCount: number,
  repeats: number
): number {
  if (repeats < 1) throw new Error('repeats must be >= 1');
  // Discard the first run as warmup (JIT, cold cache).
  runGameSession(roomCode, playerCount, roundCount);
  const totals: number[] = [];
  for (let i = 0; i < repeats; i += 1) {
    const result = runGameSession(roomCode, playerCount, roundCount);
    totals.push(result.totalMs);
  }
  return percentile(totals, 0.95);
}

/** Assert no peer leaked after stopping all sessions. Call this right after stop(), before
 * resetPeers(), so a failed deregistration is visible rather than hidden by cleanup. */
export function assertNoPeerLeak(): void {
  const count = InMemoryTransport.peerCount();
  if (count !== 0) {
    throw new Error(`${count} peers still registered after stop()`);
  }
}
