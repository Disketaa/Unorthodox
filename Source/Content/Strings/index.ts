import { app } from './App';
import { lobby } from './Lobby';
import { characters } from './Game';
import { writing } from './Game';
import { reviewing } from './Game';
import { scores } from './Game';
import { phaseSplash } from './Game';
import { turn } from './Game';
import { pause } from './Game';
import { phase } from './Game';
import { final } from './Game';
import { status } from './Game';
import { effects } from './Game';
import { diagnostics } from './Game';

/** All user-visible text. Screens and App must not contain literal strings. */
export const Strings = {
  app,
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
  lobby,
  characters,
  writing,
  reviewing,
  scores,
  phaseSplash,
  turn,
  pause,
  phase,
  final,
  status,
  diagnostics,
  effects,
} as const;
