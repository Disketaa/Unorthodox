import type { BalanceParams } from './Params.ts';
import type { Formula } from './Formulas.ts';
import { scoreCard } from './Formulas.ts';
import { Random, seedOf } from './Random.ts';
import type { ProfileName } from './Strategies.ts';
import { biasFor, profileOf, strategyOf } from './Strategies.ts';

/** One answer as the round wrote it down. `weight` is how good the room finds it, drawn once and
 * reused by the like pass, so an answer that was liked is liked for the reason it was drawn. */
interface Card {
  text: string;
  weight: number;
  speedShare: number;
}

/** One seat's game. The profile is drawn once and kept for the whole room: a player who always
 * answers late and never copies is a fact about them, and re-rolling it every round would
 * flatten the very spread the strategy tables are here to measure. */
interface Seat {
  profile: ProfileName;
  writerBias: number;
  /** How late this seat's answer reaches the host, on a connection that is slow rather than on a
   * player who is slow. Part of the writing window is spent on the wire. */
  lagMs: number;
  total: number;
  fromSpeed: number;
  fromLikes: number;
  zeroRounds: number;
  played: number;
  duplicates: number;
}

export interface RoomResult {
  /** Final totals, one per seat, in seat order. */
  totals: number[];
  /** What the room's winner took off the runner-up. Zero in a tie, and the number a formula
   * flattens is the number that makes a game feel decided. */
  margin: number;
  fromSpeed: number;
  fromLikes: number;
  deadSeats: number;
  /** Seat-rounds spent on an answer somebody else had written, over the whole room. The board's
   * own collision rate, which is the one thing a scoring rule cannot change. */
  duplicates: number;
  /** Seat-rounds that were played and scored nothing, and the seat-rounds that were played. The
   * share of the game a formula spends saying nobody wins anything. */
  zeroRounds: number;
  /** Zero seat-rounds that were not the writer's fault in the sense of the board: a blank card
   * or a card the host struck out. What is left of `zeroRounds` is what the board did. */
  otherZeroRounds: number;
  playedRounds: number;
  /** Points and rounds by the multiplier the round wore. An enchantment is OP when its share of
   * the room's points is larger than its share of the rounds. */
  pointsByMult: Map<number, number>;
  roundsByMult: Map<number, number>;
  /** Seat-rounds spent in a round wearing each multiplier. The denominator for points per
   * seat-round: pairing a room's points against the whole configuration's seats would flatten
   * every multiplier to the same number. */
  seatRoundsByMult: Map<number, number>;
  /** Cumulative totals after every round, `round x seat`, which is the only way to say anything
   * about a comeback: a final table cannot tell a winner who was always ahead from one who took
   * it in the last three rounds. */
  trajectory: number[][];
  /** Final totals and finishing ranks per profile, so a strategy can be judged on wins and not
   * only on points. */
  totalsByProfile: Map<ProfileName, number[]>;
  /** Seat-rounds each profile spent on a card somebody else had already written. The rate is the
   * whole of the copying strategy's cost, and it has to be on the same table as its score. */
  duplicatesByProfile: Map<ProfileName, number[]>;
  ranksByProfile: Map<ProfileName, number[]>;
  winsByProfile: Map<ProfileName, number>;
  profiles: ProfileName[];
}

function quantile(sorted: readonly number[], share: number): number {
  if (sorted.length === 0) return 0;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round(share * (sorted.length - 1))));
  return sorted[at];
}

function median(values: readonly number[]): number {
  return quantile([...values].sort((a, b) => a - b), 0.5);
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

/** The bank index for a new answer, drawn against a Zipf curve rather than uniformly: the head
 * of a board is written by everybody, the tail by nobody, and a uniform bank never collides, so
 * a board where nothing collides never punishes anybody. */
function pickFromBank(random: Random, params: BalanceParams): number {
  const weights: number[] = [];
  let total = 0;
  for (let i = 0; i < params.answerBankSize; i += 1) {
    const weight = 1 / Math.pow(i + 1, params.popularitySkew);
    weights.push(weight);
    total += weight;
  }
  let draw = random.next() * total;
  for (let i = 0; i < weights.length; i += 1) {
    draw -= weights[i];
    if (draw <= 0) return i;
  }
  return weights.length - 1;
}

/** The answer on the board the room most agrees with. Copying this is the strategy that puts two
 * players on one card, so it is the one worth measuring against writing something of your own. */
function headOf(board: readonly (Card | null)[]): Card | undefined {
  let best: Card | undefined;
  for (const card of board) {
    if (!card) continue;
    if (!best || card.weight > best.weight) best = card;
  }
  return best;
}

/** The board for one round, one entry per seat and a hole where a seat never answered.
 * Duplicates fall out of the copying and the bank rather than being written in, so a big room
 * duplicates for the reason a big room duplicates. */
function writeBoard(
  random: Random,
  params: BalanceParams,
  seats: readonly Seat[],
  multsBySeat: readonly number[]
): (Card | null)[] {
  const board: (Card | null)[] = [];
  const written: Card[] = [];
  for (let seat = 0; seat < seats.length; seat += 1) {
    if (random.chance(params.blankRate)) {
      board.push(null);
      continue;
    }
    const enchantCost = multsBySeat[seat] > 1 ? params.enchantCostShare : 0;
    const share = Math.min(
      1,
      Math.max(
        0,
        seats[seat].writerBias +
          random.between(0, params.speedSpread) +
          seats[seat].lagMs / params.writingMs +
          enchantCost
      )
    );
    const copying = strategyOf(seats[seat].profile) === 'Copy';
    const target = copying ? headOf(board) : written[0];
    const copied = target && random.chance(copying ? params.copyRate : params.echoRate) ? target : undefined;
    if (copied) {
      board.push({ ...copied, speedShare: share });
      continue;
    }
    const card: Card = {
      text: `answer-${pickFromBank(random, params)}`,
      weight: 1 / Math.pow(written.length + 1, params.popularitySkew),
      speedShare: share,
    };
    written.push(card);
    board.push(card);
  }
  return board;
}

/** How many of the other seats liked an answer. Popularity sets how like a like is at all, so
 * the room's opinion and the room's collisions are the same curve seen twice. */
function likeCount(random: Random, params: BalanceParams, weight: number, playerCount: number): number {
  let likes = 0;
  for (let other = 1; other < playerCount; other += 1) {
    if (random.chance(Math.min(1, params.likeGenerosity * (0.25 + weight)))) likes += 1;
  }
  return Math.min(likes, params.maxLikes);
}

/** One group of seats that wrote the same thing. The card is kept beside the seats rather than
 * read back out of the board, so a duplicated answer is scored once per seat exactly as the
 * reducer scores it. */
interface BoardGroup {
  card: Card;
  seats: number[];
}

function groupBoard(board: readonly (Card | null)[]): BoardGroup[] {
  const groups: BoardGroup[] = [];
  for (let seat = 0; seat < board.length; seat += 1) {
    const card = board[seat];
    if (!card) continue;
    const found = groups.find((group) => group.card.text === card.text);
    if (found) {
      found.seats.push(seat);
      continue;
    }
    groups.push({ card, seats: [seat] });
  }
  return groups;
}

/** Who an enchantment reaches this round, as the multiplier each seat actually wears. The seats
 * it does not reach are neither slowed down nor multiplied: a card whose constraint and whose
 * multiplier are the same card cannot be one without the other. `Leader` hands the round to
 * whoever is already ahead, which is a reward for the lead rather than a way back into it.
 * `Laggards` is the catch-up, and it works by closing the field. `Self` is one seat, picked at
 * random here because the room's chooser is not modelled. */
function multsBySeat(
  random: Random,
  params: BalanceParams,
  seats: readonly Seat[],
  mult: number
): number[] {
  if (mult <= 1 || params.targeting === 'All') {
    return seats.map(() => mult);
  }
  const totals = seats.map((seat) => seat.total);
  const ordered = [...totals].sort((a, b) => a - b);
  const middle = ordered[Math.floor(ordered.length / 2)] ?? 0;
  const best = ordered[ordered.length - 1] ?? 0;
  const chosen = seats.map((_, seat) => {
    switch (params.targeting) {
      case 'Leader':
        return totals[seat] === best;
      case 'Laggards':
        return totals[seat] < middle;
      case 'Self':
        return false;
      case 'Random':
        return random.chance(params.randomTargetShare);
      case 'All':
        return true;
    }
  });
  if (params.targeting === 'Self') {
    const seat = random.index(seats.length);
    chosen[seat] = true;
  }
  return chosen.map((reached) => (reached ? mult : 1));
}

/** Round-level points, split into the speed part and the like part so a table can say how much
 * of the room's total came from being quick and how much from being liked. */
export interface RoundSplit {
  fromSpeed: number;
  fromLikes: number;
  points: number;
}

function scoreRound(
  random: Random,
  params: BalanceParams,
  formula: Formula,
  playerCount: number,
  seats: Seat[]
): { split: RoundSplit; mult: number } {
  const mult =
    random.chance(params.unenchantedRate) || params.mults.length === 0
      ? 1
      : params.mults[random.index(params.mults.length)];
  const mults = multsBySeat(random, params, seats, mult);
  const board = writeBoard(random, params, seats, mults);
  const groups = groupBoard(board);
  const bySeat = new Map<number, RoundSplit>();
  let fromSpeed = 0;
  let fromLikes = 0;

  for (const group of groups) {
    const isMuted = random.chance(params.muteRate);
    const isUnique = group.seats.length === 1;
    const card = group.card;
    const likes = isUnique ? likeCount(random, params, card.weight, playerCount) : 0;
    if (group.seats.length > 1) {
      for (const seat of group.seats) seats[seat].duplicates += 1;
    }
    for (const seat of group.seats) {
      // Scored once per seat rather than once per group: a card that reaches half the room is
      // multiplied for half the room, and one number per card cannot say that.
      const share = scoreCard(
        formula,
        {
          isUnique,
          isMuted,
          isBlank: false,
          speedShare: card.speedShare,
          mult: mults[seat] ?? 1,
          likes,
          groupSize: group.seats.length,
        },
        params
      );
      const held = bySeat.get(seat) ?? { fromSpeed: 0, fromLikes: 0, points: 0 };
      held.fromSpeed += share.fromSpeed;
      held.fromLikes += share.fromLikes;
      held.points += share.points;
      bySeat.set(seat, held);
    }
  }

  for (let seat = 0; seat < seats.length; seat += 1) {
    const played = board[seat] !== null;
    const held = bySeat.get(seat);
    if (played) seats[seat].played += 1;
    seats[seat].total += held?.points ?? 0;
    seats[seat].fromSpeed += held?.fromSpeed ?? 0;
    seats[seat].fromLikes += held?.fromLikes ?? 0;
    fromSpeed += held?.fromSpeed ?? 0;
    fromLikes += held?.fromLikes ?? 0;
    if (played && (held?.points ?? 0) === 0) seats[seat].zeroRounds += 1;
  }

  return { split: { fromSpeed, fromLikes, points: fromSpeed + fromLikes }, mult };
}

/** Ranked seat indexes after one round, best first. Ties broken by seat order, which is
 * arbitrary and left so: a tie is a tie, and pretending otherwise would invent a lead that was
 * not there. */
function ranking(totals: readonly number[]): number[] {
  return totals
    .map((total, seat) => ({ total, seat }))
    .sort((a, b) => b.total - a.total || a.seat - b.seat)
    .map((entry) => entry.seat);
}

/** One full room: `rounds` rounds of writing, grouping, liking and scoring, with the totals
 * carried the way the reducer carries them. */
export function playRoom(
  params: BalanceParams,
  playerCount: number,
  rounds: number,
  formula: Formula,
  seed: number
): RoomResult {
  const random = new Random(seed);
  const seats: Seat[] = [];
  for (let i = 0; i < playerCount; i += 1) {
    const profile = profileOf(params.mix, random.next());
    seats.push({
      profile,
      writerBias: Math.min(
        0.95,
        Math.max(0, random.between(-params.writerSpread, params.writerSpread) + biasFor(profile, params))
      ),
      lagMs: random.chance(params.laggingShare) ? params.lagMs : 0,
      total: 0,
      fromSpeed: 0,
      fromLikes: 0,
      zeroRounds: 0,
      played: 0,
      duplicates: 0,
    });
  }

  const trajectory: number[][] = [];
  const pointsByMult = new Map<number, number>();
  const roundsByMult = new Map<number, number>();
  const seatRoundsByMult = new Map<number, number>();

  for (let round = 0; round < rounds; round += 1) {
    const { split, mult } = scoreRound(random, params, formula, playerCount, seats);
    pointsByMult.set(mult, (pointsByMult.get(mult) ?? 0) + split.points);
    roundsByMult.set(mult, (roundsByMult.get(mult) ?? 0) + 1);
    seatRoundsByMult.set(mult, (seatRoundsByMult.get(mult) ?? 0) + playerCount);
    trajectory.push(seats.map((seat) => seat.total));
  }

  const totals = seats.map((seat) => seat.total);
  const order = ranking(totals);
  const totalsByProfile = new Map<ProfileName, number[]>();
  const ranksByProfile = new Map<ProfileName, number[]>();
  const winsByProfile = new Map<ProfileName, number>();
  const duplicatesByProfile = new Map<ProfileName, number[]>();
  order.forEach((seat, rank) => {
    const profile = seats[seat].profile;
    totalsByProfile.set(profile, [...(totalsByProfile.get(profile) ?? []), totals[seat]]);
    ranksByProfile.set(profile, [...(ranksByProfile.get(profile) ?? []), rank + 1]);
    duplicatesByProfile.set(profile, [
      ...(duplicatesByProfile.get(profile) ?? []),
      seats[seat].duplicates,
    ]);
    if (rank === 0) winsByProfile.set(profile, (winsByProfile.get(profile) ?? 0) + 1);
  });

  return {
    totals,
    margin: totals[order[0]] - totals[order[1] ?? order[0]],
    fromSpeed: seats.reduce((sum, seat) => sum + seat.fromSpeed, 0),
    fromLikes: seats.reduce((sum, seat) => sum + seat.fromLikes, 0),
    deadSeats: totals.filter((total) => total === 0).length,
    duplicates: seats.reduce((sum, seat) => sum + seat.duplicates, 0),
    zeroRounds: seats.reduce((sum, seat) => sum + seat.zeroRounds, 0),
    otherZeroRounds: seats.reduce(
      (sum, seat) => sum + Math.max(0, seat.zeroRounds - seat.duplicates),
      0
    ),
    playedRounds: seats.reduce((sum, seat) => sum + seat.played, 0),
    pointsByMult,
    roundsByMult,
    seatRoundsByMult,
    trajectory,
    totalsByProfile,
    ranksByProfile,
    duplicatesByProfile,
    winsByProfile,
    profiles: seats.map((seat) => seat.profile),
  };
}

export interface ConfigResult {
  formula: Formula;
  playerCount: number;
  rounds: number;
  totals: number[];
  mean: number;
  median: number;
  p10: number;
  p90: number;
  max: number;
  /** p90 - p10: how far apart a good seat and a poor one end up. */
  spread: number;
  meanMargin: number;
  medianMargin: number;
  /** Share of rooms where first and second finished level. The game has one winner on the final
   * screen, so this is the share of games that end without one. */
  tieRatePercent: number;
  /** Share of rooms where the winner took it by one point or less: a tie that the next run would
   * have flipped. Read together with the tie rate, this is how close the whole field finishes. */
  nearTieRatePercent: number;
  deadSeatRate: number;
  zeroRoundRate: number;
  speedSharePercent: number;
  fromSpeed: number;
  fromLikes: number;
}

/** One configuration, run `roomsPerConfig` times on its own seeds. Every seat of every room is
 * one sample, so a table's percentiles are over players and not over rooms. */
export function runConfig(
  params: BalanceParams,
  formula: Formula,
  playerCount: number,
  rounds: number
): ConfigResult {
  const totals: number[] = [];
  const margins: number[] = [];
  let fromSpeed = 0;
  let fromLikes = 0;
  let deadSeats = 0;
  let zeroRounds = 0;
  let playedRounds = 0;
  let ties = 0;
  let nearTies = 0;

  for (let room = 0; room < params.roomsPerConfig; room += 1) {
    const result = playRoom(params, playerCount, rounds, formula, seedOf(params.seed, playerCount, rounds, room));
    totals.push(...result.totals);
    margins.push(result.margin);
    fromSpeed += result.fromSpeed;
    fromLikes += result.fromLikes;
    deadSeats += result.deadSeats;
    zeroRounds += result.zeroRounds;
    playedRounds += result.playedRounds;
    if (result.margin === 0) ties += 1;
    if (result.margin <= 1) nearTies += 1;
  }

  const rooms = Math.max(1, params.roomsPerConfig);
  const sorted = [...totals].sort((a, b) => a - b);
  return {
    formula,
    playerCount,
    rounds,
    totals,
    mean: mean(totals),
    median: median(totals),
    p10: quantile(sorted, 0.1),
    p90: quantile(sorted, 0.9),
    max: sorted[sorted.length - 1] ?? 0,
    spread: quantile(sorted, 0.9) - quantile(sorted, 0.1),
    meanMargin: mean(margins),
    medianMargin: median(margins),
    tieRatePercent: Number(((ties / rooms) * 100).toFixed(1)),
    nearTieRatePercent: Number(((nearTies / rooms) * 100).toFixed(1)),
    deadSeatRate: deadSeats / Math.max(1, totals.length),
    zeroRoundRate: zeroRounds / Math.max(1, playedRounds),
    speedSharePercent: Number(((fromSpeed / Math.max(1, fromSpeed + fromLikes)) * 100).toFixed(1)),
    fromSpeed,
    fromLikes,
  };
}
