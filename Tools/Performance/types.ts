/** A single timed operation inside a game phase. */
export interface TimedOp {
  /** The name of the operation, for example `startWriting` or `submitAnswer`. */
  readonly name: string;
  /** How long the operation took, in milliseconds. */
  readonly ms: number;
}

/** One measurement of the process's measurable state, taken between rounds. */
export interface MemorySnapshot {
  /** The number of own properties on the global object, a coarse proxy for leaked globals. */
  readonly globalKeys: number;
  /** The heap size reported by the runtime, in bytes, or undefined where it is not available. */
  readonly heapUsedJsBytes: number | undefined;
}

/** The difference between two snapshots, positive where the later one grew. */
export interface MemoryDelta {
  readonly globalKeys: number;
  readonly heapUsedJsBytes: number | undefined;
}

/** The result of running one simulated game through the harness. */
export interface PerfResult {
  /** How many rounds were played. */
  readonly rounds: number;
  /** How many players were in the room, including the host. */
  readonly players: number;
  /** Every timed operation, in the order it ran. */
  readonly ops: readonly TimedOp[];
  /** Memory snapshots, one per round boundary. */
  readonly snapshots: readonly MemorySnapshot[];
  /** The slowest single operation, or undefined when nothing was timed. */
  readonly slowestOp: TimedOp | undefined;
  /** The total time spent in all timed operations, in milliseconds. */
  readonly totalMs: number;
  /** How many answers were submitted in total across all rounds. */
  readonly submittedCount: number;
}

/** Thresholds that decide whether a performance test passes or fails. */
export interface PerfThresholds {
  /** The maximum milliseconds any single operation may take. */
  readonly maxOpMs: number;
  /** The maximum milliseconds the whole game may take. */
  readonly maxTotalMs: number;
  /** The maximum number of new global keys allowed between snapshots. */
  readonly maxGlobalKeyGrowth: number;
  /** The maximum heap growth per round, in bytes. Zero means no tolerance. */
  readonly maxHeapGrowthPerRound: number;
}

/** Default thresholds: generous enough for CI, tight enough to catch regressions. */
export const DefaultThresholds: PerfThresholds = {
  maxOpMs: 50,
  maxTotalMs: 5000,
  maxGlobalKeyGrowth: 0,
  maxHeapGrowthPerRound: 0,
};
