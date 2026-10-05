/** The paces a room can be set to, as the three times a player waits through. `Standard` is
 * written from `timing` rather than as three numbers of its own, so the pace the room is not
 * using cannot drift away from the durations the game actually runs on. */
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
  /** The count-in before the first round, and the writing time it is added to. The writing phase
   * is this much longer than the pace says, so the count-in is time the players get rather than
   * time taken from them. Two parts, the shade first and the numbers over it, so the first is
   * not already half faded. */
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
    /** How many themes a lobby is offered at once. Six because they are drawn three across and
     * two down, and the bank of theme cards is written for that shape, so a different count
     * would be a different arrangement. */
    cardsPerLobby: 6,
    /** How many rounds a theme is played for. The number of ticks along the bottom of a card,
     * and the number of topics the theme answers for. Ten because the game is five rounds and
     * two themes to a round fills it. */
    roundsPerTheme: 10,
  },
  limits: {
    nameMaxLength: 16,
    answerMaxLength: 80,
    roomCodeLength: 4,
    minPlayers: 2,
    /** How many players a room holds. The bar of players across the top of a game holds this
     * many, so the room and the bar are the same size and nothing is dropped from one and kept
     * in the other. */
    maxPlayers: 16,
  },
};