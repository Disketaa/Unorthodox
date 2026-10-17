import type { BalanceParams } from './Params.ts';
import type { Formula } from './Formulas.ts';
import { playRoom } from './Simulation.ts';
import type { RoomResult } from './Simulation.ts';
import { Profiles } from './Strategies.ts';
import type { ProfileName, StrategyMix } from './Strategies.ts';
import { seedOf } from './Random.ts';

/** A. Is an enchantment worth having? Points and rounds by multiplier, so the share of the
 * room's points a multiplier took can be read against the share of the rounds it was worn on. A
 * multiplier whose point share beats its round share by more than the multiplier itself is
 * earning more than its number; one that loses is dead weight on the bar. */
export interface EnchantRow {
  mult: number;
  rounds: number;
  points: number;
  roundSharePercent: number;
  pointSharePercent: number;
  /** Points per seat-round in a round wearing this multiplier, against a plain round. */
  perSeatRound: number;
  againstPlain: number;
}

export interface EnchantAnalysis {
  rows: EnchantRow[];
}

/** B. Is a comeback real? The trajectory is the only place this can be asked: the final table
 * cannot tell a winner who led the whole way from one who took it in the last rounds. */
export interface ComebackRow {
  round: number;
  /** Share of rooms whose leader was not the leader of the previous round. */
  leaderChangedPercent: number;
  /** Mean gap between first and second at this point in the game. */
  meanGap: number;
  /** Where the eventual winner stood at this round: 1 is leading, `playerCount` is last. */
  winnerMeanRank: number;
  /** Share of rooms whose winner was already the leader after the first round. */
  winnerWasFirstLeaderPercent: number;
}

export interface ComebackAnalysis {
  rows: ComebackRow[];
  finalWinnerWasFirstLeaderPercent: number;
}

/** C. How much of a game is the draw and how much is the play? Total variance of every seat's
 * total, split into the part the profile explains and the part the dice keeps. */
export interface VarianceAnalysis {
  totalVariance: number;
  betweenProfileVariance: number;
  withinProfileVariance: number;
  strategySharePercent: number;
  drawSharePercent: number;
}

/** D. What each way of playing is worth, at a given mix. This is the table that says whether
 * copying the common answer fast beats writing something nobody else wrote slowly. */
export interface StrategyRow {
  profile: ProfileName;
  seats: number;
  meanScore: number;
  winRatePercent: number;
  topThreeRatePercent: number;
  meanRank: number;
  /** Share of this profile's seat-rounds spent on an answer somebody else had written. Under a
   * rule where a duplicated answer scores nothing, this is the share of the game it threw away. */
  duplicateRatePercent: number;
}

export interface StrategyAnalysis {
  mixName: string;
  rows: StrategyRow[];
}

export interface AnalysisBundle {
  enchant: EnchantAnalysis;
  comeback: ComebackAnalysis;
  variance: VarianceAnalysis;
  strategies: StrategyAnalysis[];
}

/** Which round numbers the comeback table reads at. Enough to see where a lead stops mattering,
 * without a row per round of a sixty-round game. */
function checkpoints(rounds: number): number[] {
  const marks = [1, 2, 3, 5, 8, 12, 20, 30, 45, 60].filter((round) => round <= rounds);
  return [...new Set([...marks, rounds])];
}

function aggregateEnchant(rooms: readonly RoomResult[]): EnchantAnalysis {
  const points = new Map<number, number>();
  const counts = new Map<number, number>();
  const seatRounds = new Map<number, number>();
  for (const room of rooms) {
    for (const [mult, value] of room.pointsByMult) points.set(mult, (points.get(mult) ?? 0) + value);
    for (const [mult, value] of room.roundsByMult) counts.set(mult, (counts.get(mult) ?? 0) + value);
    for (const [mult, value] of room.seatRoundsByMult) {
      seatRounds.set(mult, (seatRounds.get(mult) ?? 0) + value);
    }
  }
  const totalPoints = [...points.values()].reduce((sum, value) => sum + value, 0);
  const totalRounds = [...counts.values()].reduce((sum, value) => sum + value, 0);
  const perSeatRound = (mult: number): number => (points.get(mult) ?? 0) / Math.max(1, seatRounds.get(mult) ?? 0);
  const plain = perSeatRound(1);
  const rows = [...points.keys()]
    .sort((a, b) => a - b)
    .map((mult) => ({
      mult,
      rounds: counts.get(mult) ?? 0,
      points: points.get(mult) ?? 0,
      roundSharePercent: round100(counts.get(mult) ?? 0, totalRounds),
      pointSharePercent: round100(points.get(mult) ?? 0, totalPoints),
      perSeatRound: Number(perSeatRound(mult).toFixed(2)),
      againstPlain: Number((perSeatRound(mult) / Math.max(0.01, plain)).toFixed(2)),
    }));
  return { rows };
}

function round100(part: number, whole: number): number {
  return Number(((part / Math.max(1, whole)) * 100).toFixed(1));
}

function aggregateComeback(rooms: readonly RoomResult[], rounds: number): ComebackAnalysis {
  const marks = checkpoints(rounds);
  const changed = new Map<number, number>();
  const gaps = new Map<number, number[]>();
  const ranks = new Map<number, number[]>();
  const firstLeaderWins = new Map<number, number>();
  let roomsCounted = 0;

  for (const room of rooms) {
    roomsCounted += 1;
    const winner = winnerSeat(room);
    const firstLeader = leaderOf(room.trajectory[0]);
    firstLeaderWins.set(rounds, (firstLeaderWins.get(rounds) ?? 0) + (firstLeader === winner ? 1 : 0));
    room.trajectory.forEach((cumulative, index) => {
      const round = index + 1;
      const previous = index > 0 ? room.trajectory[index - 1] : undefined;
      if (previous && leaderOf(previous) !== leaderOf(cumulative)) {
        changed.set(round, (changed.get(round) ?? 0) + 1);
      }
    });
    for (const mark of marks) {
      const cumulative = room.trajectory[Math.min(room.trajectory.length, mark) - 1];
      if (!cumulative) continue;
      const sorted = [...cumulative].sort((a, b) => b - a);
      gaps.set(mark, [...(gaps.get(mark) ?? []), sorted[0] - (sorted[1] ?? 0)]);
      ranks.set(mark, [...(ranks.get(mark) ?? []), sorted.indexOf(cumulative[winner] ?? 0) + 1]);
    }
  }

  const rows = marks.map((mark) => {
    const gapList = gaps.get(mark) ?? [];
    const rankList = ranks.get(mark) ?? [];
    return {
      round: mark,
      leaderChangedPercent: round100(changed.get(mark) ?? 0, roomsCounted * (mark > 1 ? 1 : 0)),
      meanGap: Number((avg(gapList)).toFixed(1)),
      winnerMeanRank: Number(avg(rankList).toFixed(1)),
      winnerWasFirstLeaderPercent: round100(firstLeaderWins.get(rounds) ?? 0, roomsCounted),
    };
  });

  return { rows, finalWinnerWasFirstLeaderPercent: rows[rows.length - 1]?.winnerWasFirstLeaderPercent ?? 0 };
}

function leaderOf(cumulative: readonly number[]): number {
  let best = 0;
  for (let seat = 1; seat < cumulative.length; seat += 1) {
    if ((cumulative[seat] ?? 0) > (cumulative[best] ?? 0)) best = seat;
  }
  return best;
}

function winnerSeat(room: RoomResult): number {
  let best = 0;
  room.totals.forEach((total, seat) => {
    if (total > (room.totals[best] ?? 0)) best = seat;
  });
  return best;
}

function avg(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function variance(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const meanValue = avg(values);
  return avg(values.map((value) => (value - meanValue) ** 2));
}

function aggregateVariance(rooms: readonly RoomResult[]): VarianceAnalysis {
  const byProfile = new Map<ProfileName, number[]>();
  for (const room of rooms) {
    for (const profile of Profiles) {
      byProfile.set(profile, [...(byProfile.get(profile) ?? []), ...(room.totalsByProfile.get(profile) ?? [])]);
    }
  }
  const all = [...byProfile.values()].flat();
  const totalVariance = variance(all);
  const grand = avg(all);
  // Between profiles: how far each profile's mean sits from the room's own mean, weighted by how
  // many seats played it. Within: what is left once the profile is known, which is the draw.
  const between = byProfile.size
    ? [...byProfile.values()].reduce((sum, values) => sum + values.length * (avg(values) - grand) ** 2, 0) / Math.max(1, all.length)
    : 0;
  const within = Math.max(0, totalVariance - between);
  return {
    totalVariance,
    betweenProfileVariance: between,
    withinProfileVariance: within,
    strategySharePercent: round100(between, totalVariance),
    drawSharePercent: round100(within, totalVariance),
  };
}

function aggregateStrategies(rooms: readonly RoomResult[], mixName: string, rounds: number): StrategyAnalysis {
  const rows = Profiles.map((profile) => {
    const totals: number[] = [];
    const ranks: number[] = [];
    const duplicates: number[] = [];
    let wins = 0;
    for (const room of rooms) {
      const roomTotals = room.totalsByProfile.get(profile) ?? [];
      const roomRanks = room.ranksByProfile.get(profile) ?? [];
      totals.push(...roomTotals);
      ranks.push(...roomRanks);
      duplicates.push(...(room.duplicatesByProfile.get(profile) ?? []));
      wins += room.winsByProfile.get(profile) ?? 0;
    }
    const seatCount = totals.length;
    const topThree = ranks.filter((rank) => rank <= 3).length;
    if (seatCount === 0) return undefined;
    return {
      profile,
      seats: seatCount,
      meanScore: Number(avg(totals).toFixed(1)),
      winRatePercent: round100(wins, roomCountWith(rooms, profile)),
      topThreeRatePercent: round100(topThree, seatCount),
      meanRank: Number(avg(ranks).toFixed(2)),
      duplicateRatePercent: round100(avg(duplicates), rounds),
    };
  });
  return { mixName, rows: rows.filter((row) => row !== undefined) };
}

/** Win rate is over the rooms a profile appeared in, not over rooms: a profile the mix gives
 * nobody cannot be said to have a 0% win rate when it was never played. */
function roomCountWith(rooms: readonly RoomResult[], profile: ProfileName): number {
  return rooms.filter((room) => room.profiles.includes(profile)).length;
}

export interface MixRun {
  name: string;
  mix: StrategyMix;
}

/** Every analysis for one formula at one room size, over the mixes asked for. */
export function analyse(
  params: BalanceParams,
  formula: Formula,
  playerCount: number,
  rounds: number,
  mixes: readonly MixRun[]
): AnalysisBundle {
  const primary = mixes[0];
  const rooms = roomsFor(params, formula, playerCount, rounds, primary);
  return {
    enchant: aggregateEnchant(rooms),
    comeback: aggregateComeback(rooms, rounds),
    variance: aggregateVariance(rooms),
    strategies: mixes.map((mix) =>
      aggregateStrategies(roomsFor(params, formula, playerCount, rounds, mix), mix.name, rounds)
    ),
  };
}

/** Rooms for one mix, on their own seed stream so two mixes meet different dice and a difference
 * between them is the mix rather than the seed. */
function roomsFor(
  params: BalanceParams,
  formula: Formula,
  playerCount: number,
  rounds: number,
  mix: MixRun
): RoomResult[] {
  return roomResults(params, { ...params, mix: mix.mix }, formula, playerCount, rounds, 1000);
}

function roomResults(
  params: BalanceParams,
  withMix: BalanceParams,
  formula: Formula,
  playerCount: number,
  rounds: number,
  stream: number
): RoomResult[] {
  const rooms: RoomResult[] = [];
  for (let room = 0; room < params.roomsPerConfig; room += 1) {
    rooms.push(
      playRoom(withMix, playerCount, rounds, formula, seedOf(params.seed, playerCount, rounds, stream, room))
    );
  }
  return rooms;
}
