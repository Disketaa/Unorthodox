/** Who an enchantment reaches. The card's cost and its multiplier are the same card, so the two
 * always travel together: a seat the enchantment does not reach is neither slowed down nor
 * multiplied. */
export type Targeting = 'All' | 'Leader' | 'Laggards' | 'Self' | 'Random';

/** Everything the balance runs can be changed from here, since the point of the tool is to be
 * re-run against another set of numbers without touching the simulation. The command line can
 * override any of it; see `Balance.ts` for the flags. */
export interface BalanceParams {
  /** Room sizes to run. The real game holds 2 to 12, and the tables are only interesting at the
   * ends of that, so these are the sizes asked for. */
  playerCounts: readonly number[];
  /** How many rounds each room plays. The game itself is 4 to 8; longer runs are here to show
   * where a formula's spread settles rather than where it lands after one lucky round. */
  roundCounts: readonly number[];
  /** Repeats of the same configuration, each on its own seed. One room is an anecdote. */
  roomsPerConfig: number;
  /** How long Writing runs, and therefore what "answered with time left" is worth. */
  writingMs: number;
  /** The share of seats whose answer reaches the host late, and by how much. Not a modelling
   * convenience: the speed bonus is measured from the moment the host receives the answer, so a
   * player on a slow connection spends part of their window waiting for the message rather than
   * thinking. This is how much that costs. */
  laggingShare: number;
  lagMs: number;
  /** The share of answers a player never submits, whatever the formula says. A blank card is the
   * round's floor and every formula has to be judged against it. */
  blankRate: number;
  /** The share of cards the host mutes. A muted card scores nothing whatever it was worth, and a
   * formula that leans on speed is leaned on harder once the host starts striking cards out. */
  muteRate: number;
  /** How alike two answers are drawn to be: the chance that the next player repeats an answer
   * already on the board rather than writing something of their own. Rises with the room, which
   * is the whole difficulty of a big room and the reason 2 and 12 are the two ends worth
   * having. */
  echoRate: number;
  /** How hard a seat whose profile says Copy actually goes for the board's most popular answer.
   * Far higher than `echoRate`: a player who has decided to copy is not copying by accident,
   * and a third of their attempts landing is not the strategy the tables are here to judge. */
  copyRate: number;
  /** How steeply the popular answers are popular. Low is a flat board where almost everything is
   * unique; high is one answer everybody writes, which is a board nobody scores on. */
  popularitySkew: number;
  /** How many distinct answers a round is drawn from, before the room collides with itself.
   * Small enough that collisions are common, since a bank of a thousand answers never
   * duplicates. */
  answerBankSize: number;
  /** The top of the speed scale, in points, before any multiplier. Every curve below is a way of
   * spending this budget, so the tables compare shapes rather than sizes. */
  speedMaxPoints: number;
  /** What an answer somebody else already wrote is worth. Zero means a duplicated card is dead
   * air: with 40% of a twelve-player board duplicated, that is most of the room's cards scoring
   * nothing in most rounds. */
  pairPoints: number;
  /** Points one like is worth. Flat, and the same whether the answer was fast or slow. */
  pointsPerLike: number;
  /** Whether the speed points are made whole before the multiplier is applied. Off, the total is
   * rounded once at the end and the biggest multiplier comes out short of its number, because a
   * rounding error of half a point is a lot against seven. On, x2 is x2 and the card can
   * promise it. */
  roundSpeedBeforeMult: boolean;
  /** What an enchantment costs the writer: the share of the writing clock a banned or demanded
   * letter takes out of the room's clock. This is the other half of a card, and it is the only
   * reason a multiplier is a trade rather than free points - without it every enchanted card is
   * strictly better and the room should always take the biggest one. */
  enchantCostShare: number;
  /** Who the enchantment reaches, and for `Random` the share of the room it lands on. */
  targeting: Targeting;
  randomTargetShare: number;
  /** Multipliers a round may wear, and the share of rounds that wear none. */
  mults: readonly number[];
  unenchantedRate: number;
  /** Where a player's submission lands in the writing window: the share of the clock it took,
   * given as the low and high of a flat window plus how much the room's best writers sit below
   * it. A whole room writing at 90% of the clock is a room where speed cannot matter. */
  speedLowShare: number;
  speedSpread: number;
  writerSpread: number;
  /** How far a fast seat sits from the room's middle in the writing window, and the same for a
   * slow one. Half the gap between the two is what a round's speed bonus has at stake. */
  paceBonus: number;
  /** The share of the room playing each profile: writing their own or copying, fast or slow. The
   * report runs the named mixes rather than this default. */
  mix: { uniqueFast: number; uniqueSlow: number; copyFast: number; copySlow: number };
  /** How many distinct like counts a well-liked answer can draw, and how generous the room is
   * with them. */
  maxLikes: number;
  likeGenerosity: number;
  /** Seed for the whole run, so a table is reproducible and two formulas meet the same rooms. */
  seed: number;
}

export const DefaultParams: BalanceParams = {
  playerCounts: [2, 4, 6, 8, 12],
  roundCounts: [30, 60],
  roomsPerConfig: 200,
  writingMs: 60000,
  laggingShare: 0,
  lagMs: 0,
  blankRate: 0.05,
  muteRate: 0.05,
  echoRate: 0.1,
  copyRate: 0.8,
  popularitySkew: 0.9,
  answerBankSize: 48,
  speedMaxPoints: 20,
  pairPoints: 0,
  pointsPerLike: 1,
  roundSpeedBeforeMult: false,
  enchantCostShare: 0,
  targeting: 'All',
  randomTargetShare: 0.5,
  mults: [1.25, 1.5, 1.75, 2],
  unenchantedRate: 0.4,
  speedLowShare: 0.35,
  speedSpread: 0.5,
  writerSpread: 0.12,
  paceBonus: 0.18,
  mix: { uniqueFast: 0.25, uniqueSlow: 0.25, copyFast: 0.25, copySlow: 0.25 },
  maxLikes: 8,
  likeGenerosity: 0.35,
  seed: 20261017,
};

/** Any number in `args` of the form `flag=value` overrides the matching field, and `players` and
 * `rounds` override their lists. Shared by both runs so a flag works the same in each, and so a
 * boolean takes 1 or 0 rather than quietly becoming NaN and being dropped. */
export function applyOverrides(params: BalanceParams, args: readonly string[]): BalanceParams {
  const next: BalanceParams = { ...params };
  for (const arg of args) {
    const [flag, raw] = arg.split('=');
    if (flag === undefined || raw === undefined || flag.startsWith('--')) continue;
    if (flag === 'players' || flag === 'rounds') {
      const list = raw
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
      if (list.length > 0) {
        if (flag === 'players') next.playerCounts = list;
        else next.roundCounts = list;
      }
      continue;
    }
    if (!(flag in next)) continue;
    const current = next[flag as keyof BalanceParams];
    const value = Number(raw);
    // A word is a word and a flag that takes one never has a number to offer, so it is read
    // before the numeric guard rather than dropped by it.
    if (typeof current === 'string' && Number.isNaN(value)) {
      Object.assign(next, { [flag]: raw });
      continue;
    }
    if (!Number.isFinite(value)) continue;
    if (typeof current === 'boolean') {
      Object.assign(next, { [flag]: value !== 0 });
      continue;
    }
    Object.assign(next, { [flag]: value });
  }
  return next;
}
