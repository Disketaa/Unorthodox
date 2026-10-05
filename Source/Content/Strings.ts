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
    /** Names the list of players, on the rule that divides it from the room code. */
    roster: 'Лобби',
    /** Built from the limit, so the hint cannot drift from the actual rule. */
    notEnoughPlayers: (min: number) => `Нужно минимум ${min} игрока`,
    roomFull: 'Комната заполнена',
    /** The accessible name of the icon-only control that leaves the room. */
    exit: 'Выйти из комнаты',
    /** Says that the host's "*" took effect, since nothing else on screen moves when only the
     * console does. Only shown while logging is on, so turning it off needs no announcement. */
    debugOn: 'Отладка включена',
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
      writing: 'Ответ',
      deciding: 'Голосование',
      category: 'Выбор темы',
      /** A wait in whole seconds, which is the only unit the buttons move in. */
      seconds: (seconds: number) => `${seconds}с`,
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
    topicLabel: 'Тема',
    answerPlaceholder: 'Ваш ответ',
    submitButton: 'Ответить',
    submitted: 'Ответ принят',
    waitForOthers: 'Ждём остальных',
    submittedCount: (count: number, total: number) =>
      `Ответили: ${count} из ${total}`,
    timeUp: 'Время вышло',
  },
  reviewing: {
    topicLabel: 'Тема',
    rejectHint: 'Нажмите, если ответ не подходит',
    answersCount: (count: number) =>
      count > 1 ? `${count} одинаковых` : 'уникальный ответ',
    notVoted: 'Ответ не подходит',
    voted: 'Голос учтён',
  },
  scores: {
    headline: 'Очки за раунд',
    nextRound: 'Следующий раунд',
    waitingForHost: 'Ждём следующий раунд',
  },
  /** What the game is doing right now, on the block above the theme bank. One sentence per
   * phase, in the first person: the sentence is about this browser's own moment, and a block
   * reading about somebody else while the player is doing it has to be translated. */
  phase: {
    choosingTheme: (name: string) => `${name} выбирает тему…`,
    writing: 'Все пишут ответы…',
    reviewing: 'Голосуем за ответы…',
    scores: 'Считаем очки…',
    final: 'Игра закончена',
    connecting: 'Подключаемся…',
  },
  final: {
    headline: 'Итоги',
    playAgain: 'Сыграть ещё раз',
    place: (rank: number) => `Место: ${rank}`,
  },
  /** The themes a lobby is offered, by the same key as `ThemeId`. Here rather than beside the
   * theme bank because a theme's name is text and the bank is ids: adding a theme means a key
   * in `Core/Themes.ts` and a word here. */
  themes: {
    /** Names the row of cards, so the six read as one set rather than as six cards. */
    title: 'Темы',
    names: {
      VideoGames: 'Видеоигры',
      Nature: 'Природа',
      Internet: 'Интернет',
      Food: 'Еда',
      Music: 'Музыка',
      Movies: 'Кино',
      Work: 'Работа',
      Travel: 'Путешествия',
      Random: 'Случайная',
    },
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
  },
} as const;
