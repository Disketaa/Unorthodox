/** The lobby's settings card: the pace, the waits it decides, and the themes the room plays. */
export const lobby = {
  startButton: 'Начать игру',
  waitingForHost: 'Ждём хоста',
  /** Built from the count and limit, so the hint cannot drift from the actual roster. */
  roster: (count: number, max: number) => `Лобби (${count}/${max})`,
  /** Built from the limit, so the hint cannot drift from the actual rule. */
  notEnoughPlayers: (min: number) => `Нужно минимум ${min} игрока`,
  roomFull: 'Комната заполнена',
  /** The accessible name of the icon-only control that leaves the room. */
  exit: 'Выйти из комнаты',
  /** Puts an invented player in the room, so a host can try a full room alone. Named as what it
   * does to the room, and left in the imperative because it is something to do rather than a
   * state to read. */
  addBot: 'Добавь бота',
  /** What the host's control on a player says, naming who it would remove. */
  kick: (name: string) => `Исключить ${name}`,
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
    /** How many rounds each theme gets, shown under the pace waits. */
    roundsPerTheme: 'Раундов в теме',
    /** On the rule that opens the themes the room is played from, naming what is under it and,
     * when the room has chosen its themes, how many of them are on out of how many it may name. */
    themes: 'Темы',
    themesChosen: (count: number, max: number) => `Темы (${count}/${max})`,
    /** The same rule over the random bank: the deal against the whole set the browser knows, so
     * a host who has pasted themes can see that they are in the pool and how much of it they
     * are. */
    themesRandom: (count: number, total: number) => `Темы (${count}/${total})`,
    /** The two ways a room can be given its themes, by the same keys as the modes themselves:
     * the whole bank without naming any of it, or the themes named beside it. */
    themeModes: { Random: 'Случайно', Chosen: 'Выбранное' },
    /** A wait in whole seconds, which is the only unit the buttons move in. */
    seconds: (seconds: number) => `${seconds}с`,
    /** The most a wait can come to in this room, for a round whose length follows the board: the
     * voting wait is priced for a full house and a smaller one ends sooner, so the card shows
     * the ceiling rather than a figure the room will never actually sit through. */
    secondsUpTo: (seconds: number) => `до ${seconds}с`,
    /** Fills the window with the room, for anyone who cannot see the mark. */
    fullscreen: 'Во весь экран',
    /** Gives the window back. */
    minimize: 'Выйти из полного экрана',
    /** Turns the room's sounds off, for anyone who cannot see the mark. */
    mute: 'Выключить звук',
    /** Turns them back on. */
    unmute: 'Включить звук',
    /** Turns the music off. A word of its own rather than a second reading of the sound switch:
     * the two govern different things, and the room's presses can go quiet while the track
     * stays. */
    musicOff: 'Выключить музыку',
    /** Turns it back on. */
    musicOn: 'Включить музыку',
    /** The host pasting in custom themes: the button under the themes row that opens the paste
     * window. Named for what it is rather than what it does, since a theme is a thing and the
     * button makes it custom. */
    customThemes: 'Кастомное',
    /** The paste window's title, naming what goes in it. */
    customThemesTitle: 'Кастомные темы',
    /** The bin on the editor's corner. On a theme being edited an empty box cannot be saved as
     * one, so it strikes the theme out; on a fresh paste it empties the field. Offered in both
     * cases: the box holds the host's text, and emptying it is their call. */
    customThemesClear: 'Очистить поле',
    /** The rule over the prompt's own note and button, naming who the other half of this window
     * is for. The theme above is written here and read from here; the prompt is for somewhere
     * else entirely, and a rule saying so is what keeps two grey notes from reading as one. */
    customThemesPromptSection: 'Для ИИ',
    /** Under the title, how many questions the theme in the box carries — which is how many
     * rounds it can be played for, since one question is dealt per round and never repeated
     * within it. */
    customThemesRounds: (count: number) => `Раундов: (${count})`,
    /** The label over the text area, telling the host what to paste. */
    customThemesPaste: 'Вставьте JSON с темами',
    /** The button that saves the pasted themes and closes the window. */
    customThemesSave: 'Сохранить',
    /** The button that puts the prompt for this theme on the clipboard, for a host who would
     * rather have a theme written than write one out. */
    customThemesCopyPrompt: 'Копировать промпт',
    /** The banner over that button, saying what it copies: the prompt for writing themes, for
     * pasting into a chat. `{name}` is this theme's own name — empty where the JSON has none,
     * which is the window saying the copy will go out with the placeholder still standing. */
    customThemesCopyPromptHint:
      'Копирует промпт для составления тем в буфер обмена. Вставьте его в любой ИИ-чат, и он вернёт готовый JSON. Текущая тема: {name}',
    /** Shown when the browser would not put the prompt on the clipboard. */
    customThemesCopyFailed: 'Браузер не дал скопировать промпт',
    /** The button in the paste window that strikes the theme it was opened on out of the room. */
    customThemesRemove: 'Удалить',
    /** The mark on a custom theme's card, opening that theme in the paste window to change it. */
    editCustomThemes: 'Изменить тему',
    /** The button that closes the window without saving. */
    customThemesCancel: 'Отмена',
    /** Shown when the pasted JSON is not a valid theme list. */
    customThemesError: 'Неправильный JSON',
    /** What is wrong with the JSON where it stops making sense, said in the host's terms: the
     * fault and where it is, since a number counted from zero tells a host nothing about which
     * line to look at. */
    customThemesJsonProblems: {
      UnclosedString: 'Строка не закрыта кавычкой',
      UnclosedBracket: 'Скобка не закрыта',
      MismatchedBracket: 'Лишняя или не та скобка',
      TrailingComma: 'Лишняя запятая в конце',
      MissingValue: 'После знака стоит пустое значение',
      UnexpectedChar: 'Здесь не может быть этого символа',
      UnexpectedEnd: 'Текст обрывается на середине',
    } as const,
    /** Where in the paste the fault is, as `line:column` the way an editor counts them, so a
     * host can look straight at the place rather than counting the message out. */
    customThemesJsonProblemAt: (line: number, column: number) => `${line}:${column}`,
    /** The popup's title while the JSON in it is wrong: the window is about an error, not about
     * a theme it cannot name yet. */
    customThemesErrorTitle: 'Ошибка',
    /** Shown when a theme has no name, no color, or no questions. */
    customThemesInvalidTheme: 'Каждая тема нуждается в имени, цвете и вопросах',
    /** The button under the themes row that opens the paste window, when the room has chosen its
     * themes rather than taking the whole bank. */
    loadCustomThemes: 'Загрузить',
    /** The stem of a name for a pasted theme that arrived without one, numbered after it. Said
     * as what the theme has rather than who wrote it: a nameless theme is nameless, and the
     * host is only halfway through naming it. */
    customThemesDefaultName: 'Без названия',
    /** Shown when a custom theme carries the name of a built-in one, which it cannot: a theme is
     * keyed by its name, so two under one name is one theme, and the built-in one would go.
     * Three words: the title above is already Ошибка and the name is in the box being edited. */
    customThemesNameClash: 'Имя занято',
  },
} as const;
