/**
 * All user-visible text. Screens and App must not contain literal strings.
 */
export const Strings = {
  app: {
    title: 'Нестандартненько',
    galleryLink: 'Галерея компонентов',
  },
  common: {
    room: 'Комната',
    player: 'Игрок',
    answer: 'Ответ',
    players: 'Игроки',
    round: 'Раунд',
    next: 'Дальше',
    back: 'Назад',
  },
  join: {
    namePlaceholder: 'Имя',
    roomPlaceholder: 'Код комнаты',
    nameError: 'Введите имя',
    roomError: 'Код комнаты — 4 буквы',
    joinButton: 'Войти',
    createButton: 'Создать комнату',
  },
  lobby: {
    headline: 'Ждём игроков',
    shareHint: 'Отправьте код комнаты друзьям',
    startButton: 'Начать игру',
    waitingForHost: 'Ждём, пока хост начнёт игру',
    /** Built from the limit, so the hint cannot drift from the actual rule. */
    notEnoughPlayers: (min: number) => `Нужно минимум ${min} игрока`,
    roomFull: 'Комната заполнена',
  },
  writing: {
    topicLabel: 'Тема',
    answerPlaceholder: 'Ваш ответ',
    submitButton: 'Ответить',
    submitted: 'Ответ принят',
    waitForOthers: 'Ждём остальных',
    submittedCount: (count: number, total: number) => `Ответили: ${count} из ${total}`,
    timeUp: 'Время вышло',
  },
  reviewing: {
    topicLabel: 'Тема',
    rejectHint: 'Нажмите, если ответ не подходит',
    answersCount: (count: number) => (count > 1 ? `${count} одинаковых` : 'уникальный ответ'),
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
    hostLeft: 'Хост вышел из комнаты',
    hostLeftHint: 'Попросите его создать новую комнату',
    connecting: 'Подключаемся к комнате…',
  },
} as const;
