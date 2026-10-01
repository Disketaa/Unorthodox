/**
 * The paces a room can be set to, as the three times a player waits through.
 *
 * `Standard` is written from `timing` rather than as three numbers of its own, so
 * the pace the room is not using cannot drift away from the durations the game
 * actually runs on.
 */
export type Pace = 'Fast' | 'Standard';

export interface PaceTimings {
  /** Answering a topic. */
  writingMs: number;
  /** Reading the room's answers and rejecting the ones that do not fit. */
  decidingMs: number;
  /** Choosing what the next round asks about. */
  categoryMs: number;
}

const timing = {
  writingDurationMs: 60000,
  reviewingDurationMs: 90000,
  scoresDurationMs: 15000,
  graceMs: 3000,
  uiTickMs: 100,
  /**
   * The count-in before the first round, and the writing time it is added to.
   *
   * The room's writing phase is this much longer than the pace says, so the count-in
   * is time the players get rather than time taken from them: the phase starts when
   * the host presses Start, the numbers are up while it is under way, and everybody
   * has the full duration waiting for them once they are gone.
   *
   * Two parts rather than one. The shade comes up first and the numbers follow it, so
   * the first number is not already half faded by the time the room can see anything
   * at all. `startVeilMs` is the shade coming up, `startCountdownMs` is the three
   * numbers over it, and both are inside the writing phase rather than in front of it.
   */
  startVeilMs: 300,
  startCountdownMs: 3000,
};

export const GameConfig = {
  timing,
  paces: {
    Standard: {
      writingMs: timing.writingDurationMs,
      decidingMs: timing.reviewingDurationMs,
      categoryMs: 20000,
    },
    Fast: {
      writingMs: 40000,
      decidingMs: 60000,
      categoryMs: 15000,
    },
  } satisfies Record<Pace, PaceTimings>,
  scoring: {
    uniquePoints: 3,
    pairPoints: 1,
    commonPoints: 0,
  },
  rounds: {
    count: 5,
  },
  themes: {
    /**
     * How many themes a lobby is offered at once.
     *
     * Six because they are drawn three across and two down, and the fan of theme cards
     * is written for that shape: the tilt is a fixed set of positions, so a different
     * count would be a different arrangement rather than a longer or shorter one.
     */
    cardsPerLobby: 6,
  },
  limits: {
    nameMaxLength: 16,
    answerMaxLength: 80,
    roomCodeLength: 4,
    minPlayers: 2,
    /**
     * How many players a room holds.
     *
     * The bar of players across the top of a game holds this many, so the room and the
     * bar are the same size and nothing is ever dropped from one and kept in the other.
     * Sixteen is wide for a party game and narrow for a phone: it is what the bar can
     * draw without a player's face becoming a thumbnail.
     */
    maxPlayers: 16,
  },
};