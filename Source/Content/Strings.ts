/** All user-visible text. Screens and App must not contain literal strings. */
export const Strings = {
  app: {
    title: 'Нестандартненько',
    galleryLink: 'Галерея компонентов',
  },
  common: {
    /** Acknowledges the message on an info screen, whatever the message was. */
    ok: 'Ок',
    /** Abandons what the screen was waiting for, rather than acknowledging what it said. A
     * different word from `ok` on purpose: on a settled screen the button confirms, and on one
     * that is still waiting `ok` would promise an outcome it cannot deliver. */
    cancel: 'Отмена',
    /** The bare figure: the phase it belongs to is named beside it, so it carries no unit. */
    secondsLeft: (seconds: number) => `${seconds}`,
  },
  join: {
    namePlaceholder: 'Имя',
    roomPlaceholder: 'Код комнаты',
    nameError: 'Введите имя',
    roomError: 'Введите код комнаты, 4 цифры',
    joinButton: 'Войти',
    createButton: 'Создать комнату',
  },
  lobby: {
    startButton: 'Начать игру',
    waitingForHost: 'Ждём хоста',
    /** Built from the count and limit, so the hint cannot drift from the actual roster. */
    roster: (count: number, max: number) => `Лобби (${count}/${max})`,
    /** Built from the limit, so the hint cannot drift from the actual rule. */
    notEnoughPlayers: (min: number) => `Нужно минимум ${min} игрока`,
    roomFull: 'Комната заполнена',
    /** The accessible name of the icon-only control that leaves the room. */
    exit: 'Выйти из комнаты',
    /** Puts an invented player in the room, so a host can try a full room alone. Named as what
     * it does to the room, and left in the imperative because it is something to do rather than
     * a state to read. */
    addBot: 'Добавь бота',
    /** What the host's control on a player says, naming who it would remove. */
    kick: (name: string) => `Исключить ${name}`,
    /** The pace the room plays at, and the three waits it decides. Named as the game is named,
     * so the two buttons say what picking one does rather than naming a speed nobody has an
     * idea of. */
    settings: {
      title: 'Настройки',
      /** On the rule that opens the body of the card, naming what is under it: the two pace
       * buttons and the three waits they decide, which are one thing. */
      params: 'Параметры',
      /** The two paces, by the same key as `Pace`. Adjectives rather than names for the game: a
       * button reading "Обычно" is a choice between two speeds, where "Стандартная игра" is a
       * second name for the thing the card is already about. */
      paces: {
        Fast: 'Быстро',
        Standard: 'Обычно',
      },
      writing: 'Написание ответа',
      deciding: 'Просмотр ответов',
      category: 'Выбор темы',
      /** On the rule that opens the themes the room is played from, naming what is under it and,
       * when the room has chosen its themes, how many of them are on out of how many it may
       * name. */
      themes: 'Темы',
      themesChosen: (count: number, max: number) => `Темы (${count}/${max})`,
      /** The two ways a room can be given its themes, by the same keys as the modes themselves:
       * the whole bank without naming any of it, or the themes named beside it. */
      themeModes: { Random: 'Случайно', Chosen: 'Выбранное' },
      /** A wait in whole seconds, which is the only unit the buttons move in. */
      seconds: (seconds: number) => `${seconds}с`,
      /** The most a wait can come to in this room, for a round whose length follows the board:
       * the voting wait is priced for a full house and a smaller one ends sooner, so the card
       * shows the ceiling rather than a figure the room will never actually sit through. */
      secondsUpTo: (seconds: number) => `до ${seconds}с`,
      /** Fills the window with the room, for anyone who cannot see the mark. */
      fullscreen: 'Во весь экран',
      /** Gives the window back. */
      minimize: 'Выйти из полного экрана',
      /** Turns the room's sounds off, for anyone who cannot see the mark. */
      mute: 'Выключить звук',
      /** Turns them back on. */
      unmute: 'Включить звук',
      /** Turns the music off. A word of its own rather than a second reading of the sound
       * switch: the two govern different things, and the room's presses can go quiet while the
       * track stays. */
      musicOff: 'Выключить музыку',
      /** Turns it back on. */
      musicOn: 'Включить музыку',
    },
  },
  /** Names for the character picker. The picker is in the design system and cannot read Strings
   * itself, so the labels travel with it as a prop. */
  characters: {
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
  },
  writing: {
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
     * bans. Both layouts' spellings of each letter, since the keys are struck in whichever set
     * is up and the bar has to say the same thing to both. */
    enchantment: (letters: string) => `Буквы запрещены: ${letters}`,
    /** The other enchantment, asking for a letter rather than taking one away. Kept beside the
     * ban because the two are the same round's one enchantment, and a bar that changed its verb
     * halfway down the screen would read as two different rounds. */
    demand: (letters: string) => `Нужна буква: ${letters}`,
    /** The shortest an answer may be, and the longest, as one figure each: the two are separate
     * enchantments rather than one window, so the room is never asked to guess between them. */
    minLength: (letters: number) => `Минимум ${letters} букв`,
    maxLength: (letters: number) => `Максимум ${letters} букв`,
    /** Said over the round to the one player its enchanted card reached. The name of what has
     * happened rather than the effect, since the bar under it spells the effect out and a
     * player glancing up should be told only that it is them. */
    enchanted: 'Зачарован',
  },
  reviewing: {
    topicLabel: 'Тема',
    rejectHint: 'Нажмите, если ответ не подходит',
    /** On a card for a player who wrote nothing, so the room can see who sat the round out
     * rather than seeing that somebody is missing. */
    blank: '[ ]',
    answersCount: (count: number) => (count > 1 ? `${count} одинаковых` : 'уникальный ответ'),
    notVoted: 'Ответ не подходит',
    voted: 'Голос учтён',
    /** What a card says to a screen reader when the host may take it off the board. Named
     * without the answer on it: the card is written out letter by letter as it is read, and a
     * label quoting it would spell a half-word. */
    mute: 'Заглушить ответ',
    unmute: 'Вернуть ответ',
    /** The like badge, read out. The count and the word, since the mark alone says nothing. */
    likes: (count: number) => (count === 1 ? '1 лайк' : `${count} лайков`),
  },
  scores: {
    headline: 'Очки за раунд',
    nextRound: 'Следующий раунд',
    waitingForHost: 'Ждём следующий раунд',
  },
  /** What the mark says while the room is moving between two phases. Read out rather than shown
   * in words, since the splash is the one moment in the game with no sentence on it at all. */
  phaseSplash: {
    label: 'Фаза сменилась',
  },
  /** The room's own turn, said from the console rather than drawn as a game rule. */
  turn: {
    /** Hands the turn to the next player, whoever the room has seated next. */
    next: 'Следующий ход',
    /** Steps the room along the phase table by hand, so every phase can be walked without
     * waiting any of them out. */
    nextPhase: 'Следующая фаза',
  },
  pause: {
    /** Holds the room where it is, for as long as the host means it. */
    hold: 'Поставить на паузу',
    /** Lets the room run on from where it was held, rather than starting over. */
    resume: 'Продолжить',
    /** Said over the whole room while it is held, in the count-in's own hand: a word rather than
     * a figure, since it is something to be told rather than something being counted down. */
    held: 'Пауза',
  },
  /** What the game is doing right now, on the block above the theme bank. One sentence per
   * phase, in the first person: the sentence is about this browser's own moment, and a block
   * reading about somebody else while the player is doing it has to be translated. */
  phase: {
    choosingTheme: (name: string) => `${name} выбирает тему…`,
    /** Said over the bank once the theme has been answered, which is when the choice stops being
     * open and the question is what the room is reading. */
    readingQuestion: 'Читаем вопрос…',
    writing: 'Все пишут ответы…',
    reviewing: 'Смотрим ответы…',
    scores: 'Считаем очки…',
    final: 'Игра закончена',
    connecting: 'Подключаемся…',
  },
  final: {
    headline: 'Итоги',
    playAgain: 'Сыграть ещё раз',
    place: (rank: number) => `Место: ${rank}`,
  },
  status: {
    /** One short sentence each: what happened, and nothing else. */
    hostLeft: 'Комната была закрыта',
    nameTaken: 'Это имя уже занято',
    /** The room was past its lobby, so this player has a round they were never in. */
    alreadyStarted: 'Игра уже началась',
    /** Every seat is taken. The count is the host's, so it travels rather than being written
     * here. */
    roomFull: (maxPlayers: number) => `В комнате уже ${maxPlayers} игроков`,
    kicked: 'Вы были исключены',
    connecting: 'Подключаемся…',
    /** Said instead of the waiting one once the wait has outlasted the usual connect, and it
     * stands alone rather than being read after it: the room was not found, and waiting longer
     * will not find it. */
    stillLooking: 'Комната не найдена.',
    /** The stronger version: this device's clock could not be measured at all, so it is still
     * the first thing to suspect rather than one thing among several. */
    clockUnchecked: 'Время не синхронизировано.',
  },
  effects: {
    alone: 'Выбирающему',
    half: 'Случайным',
    laggards: 'Отстающим',
    leaders: 'Лидирующим',
  },
} as const;
