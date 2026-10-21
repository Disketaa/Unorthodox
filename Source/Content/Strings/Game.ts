/** Names for the character picker. The picker is in the design system and cannot read Strings
 * itself, so the labels travel with it as a prop. */
export const characters = {
  names: {
    Butterfly: 'Бабочка',
    Explosion: 'Взрыв',
    Daisy: 'Ромашка',
    Ghost: 'Призрак',
    Mask: 'Маска',
    Hat: 'Шляпа',
    Heart: 'Сердце',
    Star: 'Звезда',
  },
  colors: {
    Coral: 'Коралл',
    Amber: 'Янтарь',
    Yellow: 'Жёлтый',
    Lime: 'Лайм',
    Mint: 'Мятный',
    Sky: 'Небо',
    Violet: 'Фиалка',
    Rose: 'Роза',
  },
  /** Names one character in the row and says what clicking it does. */
  pickCharacter: (name: string) => `${name}, выбрать персонажа`,
  /** On the rule between the chosen character's drawing and the rows of choices. */
  customize: 'Кастомизация',
};

/** The writing screen: the bar, the keys, and what they say. */
export const writing = {
  submitButton: 'Ответить',
  submitted: 'Ответ принят',
  waitForOthers: 'Ждём остальных',
  submittedCount: (count: number, total: number) => `Ответили: ${count} из ${total}`,
  timeUp: 'Время вышло',
  /** Read out on the one on-screen key that has no letter on it. */
  backspaceKey: 'Удалить символ',
  /** Read out on the space bar, which puts a space in the answer. */
  spaceKey: 'Пробел',
  /** Read out on the key that swaps the letters to the other language. */
  langKey: 'Сменить язык',
  /** Read out on the enter key, which sends the answer rather than typing into the field. */
  enterKey: 'Ответить',
  /** The bar over the keys naming the round's enchantment: what it does, and the letters it
   * bans. Both layouts' spellings of each letter, since the keys are struck in whichever set is
   * up and the bar has to say the same thing to both. */
  enchantment: (letters: string) => `Буквы запрещены: ${letters}`,
  /** The other enchantment, asking for a letter rather than taking one away. Kept beside the ban
   * because the two are the same round's one enchantment, and a bar that changed its verb
   * halfway down the screen would read as two different rounds. */
  demand: (letters: string) => `Нужна буква: ${letters}`,
  /** The shortest an answer may be, and the longest, as one figure each: the two are separate
   * enchantments rather than one window, so the room is never asked to guess between them. */
  minLength: (letters: number) => `Минимум ${letters} букв`,
  maxLength: (letters: number) => `Максимум ${letters} букв`,
  /** Said over the round to the one player its enchanted card reached. The name of what has
   * happened rather than the effect, since the bar under it spells the effect out and a player
   * glancing up should be told only that it is them. */
  enchanted: 'Зачарован',
};

/** The reviewing screen: the board, the cards, and what the room does with them. */
export const reviewing = {
  topicLabel: 'Тема',
  rejectHint: 'Нажмите, если ответ не подходит',
  /** On a card for a player who wrote nothing, so the room can see who sat the round out rather
   * than seeing that somebody is missing. */
  blank: '[ ]',
  answersCount: (count: number) => (count > 1 ? `${count} одинаковых` : 'уникальный ответ'),
  notVoted: 'Ответ не подходит',
  voted: 'Голос учтён',
  /** What a card says to a screen reader when the host may take it off the board. Named without
   * the answer on it: the card is written out letter by letter as it is read, and a label
   * quoting it would spell a half-word. */
  mute: 'Заглушить ответ',
  unmute: 'Вернуть ответ',
  /** The like badge, read out. The count and the word, since the mark alone says nothing. */
  likes: (count: number) => (count === 1 ? '1 лайк' : `${count} лайков`),
};

/** The scores screen: the round's points and the way on. */
export const scores = {
  headline: 'Очки за раунд',
  nextRound: 'Следующий раунд',
  waitingForHost: 'Ждём следующий раунд',
};

/** What the mark says while the room is moving between two phases. Read out rather than shown in
 * words, since the splash is the one moment in the game with no sentence on it at all. */
export const phaseSplash = {
  label: 'Фаза сменилась',
};

/** The room's own turn, said from the console rather than drawn as a game rule. */
export const turn = {
  /** Hands the turn to the next player, whoever the room has seated next. */
  next: 'Следующий ход',
  /** Steps the room along the phase table by hand, so every phase can be walked without waiting
   * any of them out. */
  nextPhase: 'Следующая фаза',
  /** Begins the phase the room is in again from its first second, with the answers and the votes
   * where they were left. */
  reloadPhase: 'Начать фазу заново',
};

/** Holding the room where it is, and letting it run on again. */
export const pause = {
  /** Holds the room where it is, for as long as the host means it. */
  hold: 'Поставить на паузу',
  /** Lets the room run on from where it was held, rather than starting over. */
  resume: 'Продолжить',
  /** Said over the whole room while it is held, in the count-in's own hand: a word rather than a
   * figure, since it is something to be told rather than something being counted down. */
  held: 'Пауза',
};

/** What the game is doing right now, on the block above the theme bank. One sentence per phase,
 * in the first person: the sentence is about this browser's own moment, and a block reading
 * about somebody else while the player is doing it has to be translated. */
export const phase = {
  choosingTheme: (name: string) => `${name} выбирает тему…`,
  /** Said over the bank once the theme has been answered, which is when the choice stops being
   * open and the question is what the room is reading. */
  readingQuestion: 'Читаем вопрос…',
  writing: 'Все пишут ответы…',
  reviewing: 'Смотрим ответы…',
  scores: 'Считаем очки…',
  /** Said over the places once the round has been counted, which is the phase that follows the
   * scores: the board is read and what is left is the order. */
  leaderboard: 'Смотрим места…',
  final: 'Игра закончена',
  connecting: 'Подключаемся…',
};

/** The end of the game: the headline, the play again, and the place. */
export const final = {
  headline: 'Итоги',
  playAgain: 'Сыграть ещё раз',
  place: (rank: number) => `Место: ${rank}`,
};

/** What went wrong, or what the room is still waiting for. One short sentence each. */
export const status = {
  /** One short sentence each: what happened, and nothing else. */
  hostLeft: 'Комната была закрыта',
  nameTaken: 'Это имя уже занято',
  /** The room was past its lobby, so this player has a round they were never in. */
  alreadyStarted: 'Игра уже началась',
  /** Every seat is taken. The count is the host's, so it travels rather than being written here. */
  roomFull: (maxPlayers: number) => `В комнате уже ${maxPlayers} игроков`,
  kicked: 'Вы были исключены',
  connecting: 'Подключаемся…',
  /** Said instead of the waiting one once the wait has outlasted the usual connect, and it
   * stands alone rather than being read after it: the room was not found, and waiting longer
   * will not find it. */
  stillLooking: 'Комната не найдена.',
  /** The stronger version: this device's clock could not be measured at all, so it is still the
   * first thing to suspect rather than one thing among several. */
  clockUnchecked: 'Время не синхронизировано.',
};

/** What each enchantment is called, in the player's language. */
export const effects = {
  alone: 'Выбирающему',
  half: 'Случайным',
  laggards: 'Отстающим',
  leaders: 'Лидирующим',
};
