/** The paces a room can be set to, as the three times a player waits through. `Standard` is
 * written from `timing` rather than as three numbers of its own, so the pace the room is not
 * using cannot drift away from the durations the game actually runs on. */
export type Pace = 'Fast' | 'Standard';

export interface PaceTimings {
  /** Answering a topic. */
  writingMs: number;
  /** Reading the room's answers and rejecting the ones that do not fit. What a full room gets,
   * kept here so the phase table can still say something true about the phase. */
  decidingMs: number;
  /** The round a room of one gets, and what every further player adds to it. */
  decidingBaseMs: number;
  decidingPerPlayerMs: number;
  /** Choosing what the next round asks about. */
  categoryMs: number;
  /** The voting the room gets once the whole board is up and read. What a pace shortens is this
   * slack, never the reveal — a card cut off mid-way through naming its writers is not a
   * quicker game, it is a broken one. */
  voteMs: number;
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
   * already half faded. No phase is made longer for it: it plays out over the theme choice. */
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
   * arriving one at a time. A whole second rather than half, because the question opens behind
   * the word naming the enchantment: a shorter lead-in has the question written out under it. */
  questionLeadInMs: 1000,
  /** How long a word takes to arrive. Beat against the length of the question rather than a
   * fixed number of words, so a three-word question and a seven-word one both read at the same
   * pace. */
  questionWordMs: 210,
  /** How long the whole question stands there once every word is in, before the round starts.
   * Short enough that the reveal and the hold together read as one beat rather than as a pause
   * of its own: the words are already in, and a long hold after them is dead air. */
  questionHoldMs: 3000,
  /** How long after the round's answers start arriving, before the first of them is on screen.
   * The pause is the point of the phase: a board the room can already read is a board nobody
   * gets to watch being wrong about. */
  revealLeadInMs: 1200,
  /** How long one letter of an answer takes to arrive, and the floor and the ceiling on the
   * whole of it. A rate rather than one length, because the two answers a room writes are three
   * letters and twenty and neither should take the other's time. */
  revealLetterMs: 55,
  revealWriteMinMs: 280,
  revealWriteMaxMs: 1600,
  /** How long one answer takes to come in, and how many are left to come after the last one has
   * opened, so a full board reads as a run rather than as twelve cards appearing at once. */
  revealCardMs: 3500,
  /** How long the room has to vote once the last answer is up. The reveal is shortened rather
   * than this, so a full room is still a board everybody got to see before the phase ended. */
  revealVoteMs: 20000,
  /** How long after a card comes up before the room is told who wrote it. Held well past the
   * writing, so the answer lands on its own first: who agreed with whom is the round's best
   * joke and it is worth the room reading the sentence before it finds out. */
  revealAuthorsMs: 1600,
  /** How long after a card has said everything the room is offered anything to do about it: the
   * like in the corner, and the mute under the card. A control arriving on the same frame as
   * the thing it is about is a control rather than an invitation. */
  revealLikeMs: 1000,
  /** How long the room waits before the score starts counting up on each card. The drama beat:
   * the board is up, the room has read it, and then the numbers start arriving. */
  scoreDramaDelayMs: 300,
  /** How long one card's whole count takes — every line of it, the speed bonus and the figures
   * arriving, divided between them. Sized for the worst card, one paying three things: each
   * line needs room to be watched before the next one takes the figure over. */
  scoreCountMs: 560,
  /** How long the addition figure (+N) stays on the seat after the card is counted, before the
   * room is told what the player has altogether. Long enough to read the figure and see who it
   * belongs to. */
  scoreAddedHoldMs: 300,
  /** How long the pause is between the addition and the total, and between the total and the
   * next card. The room needs to read one figure before the next one replaces it. */
  scoreGapMs: 128,
  /** How long the player's total stands on the seat after the addition has had its moment,
   * before the count moves to the next card. Long enough to read the total before the next card
   * starts — at the card's own pace, which is the pace the addition above was given. */
  scoreTotalHoldMs: 300,
  /** How long the shade stays up over the board while the scores are counting. Long enough for
   * the room to watch the numbers arrive without the board behind them moving. */
  scoreVeilMs: 1200,
  /** How long the counted board is left standing after the last card has been paid, before the
   * room is shown where it stands. The figures are all on the board and the room has not been
   * given a moment to look at them, which is the one thing the phase is for. */
  scoreBoardLingerMs: 2500,
  /** How long between one place arriving on the standing list and the next. The list is built
   * from the last place up, so this is the beat the room reads the order on. */
  leaderboardWaveMs: 90,
  /** How long a place takes to come up once the wave has reached it. Nothing on the list is
   * counted until the whole wave is up: no figure climbs under a row that has not arrived. */
  leaderboardPlaceMs: 300,
  /** How long the new figures are left standing before the list is rearranged. The room reads
   * what the round paid before the list moves under it, so the move says the order changed
   * rather than telling the room it misread the figures. */
  leaderboardReorderDelayMs: 400,
  /** How long the places take to slide into their new order once the move has begun. */
  leaderboardReorderMs: 600,
  /** How long the rearranged list stands after the move: every figure is on the list, and the
   * room is given the time to read where everybody ended up rather than only to see that they
   * moved. */
  leaderboardLingerMs: 4500,
};

/** How many players a room holds. The bar of hexes across the top of a game holds this many in
 * one row. Here rather than inside `GameConfig`, which is not built yet when the paces below
 * use it. */
const MaxPlayers = 12;

/** The two paces' voting rounds, built from a base and a cost per head rather than written as
 * whole figures, so a new player count cannot leave the table and the arithmetic disagreeing.
 * The slower pace is longer to begin with rather than longer per player. */
const deciding = (baseMs: number, perPlayerMs: number) => ({
  decidingBaseMs: baseMs,
  decidingPerPlayerMs: perPlayerMs,
  // One player fewer than the room holds, since the base is already the first player's share and
  // the table would otherwise quote a full house more than the game gives it.
  decidingMs: baseMs + perPlayerMs * (MaxPlayers - 1),
});

/** How many letters an enchanted card bans or demands, by the multiplier it wears: one, two,
 * four and six out of the twelve lookalike pairs. It scales the cost of the enchantment rather
 * than the chance of it, so the x2 card takes half the set both layouts share. */
const LetterCounts: Record<number, number> = {
  1.25: 1,
  1.5: 2,
  1.75: 4,
  2: 6,
};

/** How many letters an enchanted card demands, by the multiplier it wears: four, three, two and
 * one, the mirror of the bans above. Taking letters away and asking for them are the same cost
 * to read and opposite costs to write, so a bigger card makes one of the two easier. */
const DemandCounts: Record<number, number> = {
  1.25: 4,
  1.5: 3,
  1.75: 2,
  2: 1,
};

/** How many letters a card's two length enchants hold an answer to, by multiplier: the least a
 * `MinLength` answer may be, and the most a `MaxLength` one may be. One climbs and the other
 * falls, so a bigger card buys its spread by asking for a pun rather than an epic. */
const LengthBounds: Record<'min' | 'max', Record<number, number>> = {
  min: { 1.25: 4, 1.5: 5, 1.75: 6, 2: 8 },
  max: { 1.25: 10, 1.5: 8, 1.75: 7, 2: 6 },
};

export const GameConfig = {
  timing,
  paces: {
    Standard: {
      writingMs: timing.writingDurationMs,
      ...deciding(10000, 5000),
      categoryMs: 20000,
      voteMs: timing.revealVoteMs,
    },
    Fast: {
      writingMs: 40000,
      ...deciding(5000, 5000),
      categoryMs: 15000,
      voteMs: timing.revealVoteMs / 2,
    },
  } satisfies Record<Pace, PaceTimings>,
  /** What a card is worth. A unique answer is paid for how early it was sent and how many likes
   * it drew; a duplicated one is paid nothing. These numbers come out of `Tools/Balance`. */
  scoring: {
    /** What an answer sent on the first tick is worth, before the card's multiplier. */
    speedMaxPoints: 20,
    /** How hard the scale leans on being early. One and a half sits between a straight line and
     * a square: enough that writing fast is a skill, gentle enough that the last third of the
     * clock still pays for the thinking. */
    speedExponent: 1.5,
    /** What one like is worth. Never multiplied: a like is the room's opinion and the card's
     * multiplier is the room's luck. */
    likePoints: 1,
    /** What an answer somebody else already wrote is worth, whatever wrote it and however early.
     * Zero, and not multiplied: the round pays for being the first to say something, and a
     * repeated sentence is not that however few people were in on it. */
    duplicatePoints: 0,
  },
  /** How two answers are decided to be the same: the edits a word may be apart by its length,
   * the shortest word an ending is stripped from, how long a run of one letter is squeezed, and
   * how many single letters in a row are a word somebody spelled out. */
  grouping: {
    noEdits: 0,
    fuzzyMinLength: 5,
    fuzzyMaxEdits: 1,
    fuzzyLongMinLength: 9,
    fuzzyLongMaxEdits: 2,
    endingMinLength: 5,
    runSqueezeMin: 2,
    strayRunMin: 3,
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
    /** Options for rounds per theme the host can pick in the lobby. Five is the floor: at three,
     * what one good round pays is more than the whole gap between first and second at the end. */
    roundsPerThemeOptions: [5, 10] as const,
    /** What a round's bank may carry on top of its six themes: how likely it is to enchant
     * anything, and how many cards it may reach. A cap rather than a count, since a bank where
     * every card is enchanted has nothing left to choose between. */
    modifiers: {
      chance: 0.6,
      maxPerRound: 3,
      effects: ['Alone', 'Half', 'Laggards', 'Leaders'] as const,
    },
    /** Multiplier values a card may wear, rolled per theme. */
    mults: [1.25, 1.5, 1.75, 2],
    /** How many letters an enchanted card takes or demands, by the multiplier it wears, counted
     * in the lookalike pairs in `Core` so a letter is the same one in both layouts. A
     * multiplier with no count here asks nothing of the answer. */
    /** The four enchantments a chosen card rolls between, one per round rather than a list: the
     * round's enchantment is a fact the room reads once, and two of them at once is a puzzle to
     * solve rather than a twist to play against. */
    enchants: ['Ban', 'Demand', 'MinLength', 'MaxLength'] as const,
    letterCounts: LetterCounts,
    /** How many of them are demanded rather than taken, on the mirrored table above. */
    demandCounts: DemandCounts,
    /** The least and the most a card's two length enchants will accept, one each. */
    lengthBounds: LengthBounds,
  },
  limits: {
    nameMaxLength: 16,
    /** How long an answer may be. Short, because an answer is a joke to be read at a glance and
     * the review screen shows the whole room's at once; a player reaching for a sentence has
     * written the wrong game. */
    answerMaxLength: 20,
    roomCodeLength: 4,
    /** Three, not two: in a room of two the winner takes so little that the pair finish level in
     * one game in eight, and one name on the final screen is the whole point of the scoring. */
    minPlayers: 3,
    maxPlayers: MaxPlayers,
  },
};
