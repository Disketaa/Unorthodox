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
  /** When the countdown under a timed phase turns to the room's alarm colour. Late rather than
   * early, because it is the last few seconds that decide an answer nobody has finished, and a
   * colour that changed half a minute out would have been something the eye learned to ignore. */
  countdownUrgentMs: 5000,
  /** How much higher the countdown's beat is pitched for each second of the way out. The beat
   * climbs over the last few seconds rather than jumping to a new note at the end, so the room
   * hears the phase closing in without the sound ever being the thing that announces it. */
  countdownPitchStepSemitones: 1,
  uiTickMs: 100,
  /** How far before the end of a phase the next phase's state is allowed to arrive and still
   * count as that phase ending on time. Clock skew and broadcast lag both land in here. */
  alarmEarlyMs: 250,
  /** How late the alarm may arrive and still be worth playing. Past it, the tab was suspended or
   * asleep: the room moved on without it, and an alarm for a phase nobody watched end is worse
   * than none. */
  alarmStaleMs: 1500,
  /** The count-in: the shade goes up over the lobby the moment the host presses Start and comes
   * down on the theme being picked. Two parts, the shade first, so the first number is not
   * already half faded. No phase is made longer for it — it plays out over the theme choice. */
  startVeilMs: 300,
  startCountdownMs: 3000,
  /** How long the room's own roll sweeps the bank before it settles on a card. Long enough for
   * the sweep to read as the room looking rather than as the room hesitating, and short enough
   * that a round nobody answered still starts promptly. */
  pickingMs: 2600,
  /** How long the sweep rests on the card it landed on before the room commits to it. */
  pickingSettleMs: 900,
  /** How long the chosen theme is left open on its own before the round starts. The clock stops
   * with it: the bank is answered, and a timer still running over an answered bank reads as
   * though the room had not decided yet. */
  answerRevealMs: 2000,
  /** How much of the room's question is written when it first appears, before the words start
   * arriving one at a time. Beat against the first word rather than a bare black screen, so the
   * reveal has something to be read on. */
  questionLeadInMs: 500,
  /** How long a word takes to arrive. Beat against the length of the question rather than a
   * fixed number of words, so a three-word question and a seven-word one both read at the same
   * pace. */
  questionWordMs: 210,
  /** How long the whole question stands there once every word is in, before the round starts.
   * Short enough that the reveal and the hold together read as one beat rather than as a pause
   * of its own: the words are already in, and a long hold after them is dead air. */
  questionHoldMs: 3000,
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
    /** How long an answer may be. Short, because an answer is a joke to be read at a glance and
     * the review screen shows the whole room's at once; a player reaching for a sentence has
     * written the wrong game. */
    answerMaxLength: 20,
    roomCodeLength: 4,
    minPlayers: 2,
    /** How many players a room holds. The bar of hexes across the top of a game holds this many
     * in one row, so the room and the bar are the same size and nothing is dropped from one and
     * kept in the other. */
    maxPlayers: 12,
  },
};
