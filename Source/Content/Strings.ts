/**
 * All user-visible text. Screens and App must not contain literal strings.
 */
export const Strings = {
  app: {
    title: 'Нестандартненько',
    galleryLink: 'Галерея компонентов',
  },
  common: {
    /** Acknowledges the message on an info screen, whatever the message was. */
    ok: 'Ок',
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
    /** Built from the limit, so the hint cannot drift from the actual rule. */
    notEnoughPlayers: (min: number) => `Нужно минимум ${min} игрока`,
    roomFull: 'Комната заполнена',
    /** The accessible name of the icon-only control that leaves the room. */
    exit: 'Выйти из комнаты',
    /** What the host's control on a player says, naming who it would remove. */
    kick: (name: string) => `Исключить ${name}`,
  },
  /**
   * Names for the character picker.
   *
   * The picker is in the design system and cannot read Strings itself, so the
   * labels travel with it as a prop.
   */
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
  final: {
    headline: 'Итоги',
    playAgain: 'Сыграть ещё раз',
    place: (rank: number) => `Место: ${rank}`,
  },
status: {
    /** One short sentence each: what happened, and nothing else. */
    hostLeft: 'Комната была закрыта',
    nameTaken: 'Это имя уже занято',
    kicked: 'Вы были исключены',
    connecting: 'Подключаемся…',
  },
} as const;
