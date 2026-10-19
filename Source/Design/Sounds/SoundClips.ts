import plingUrl from './Pling.ogg';
import popUrl from './Pop.ogg';
import revealUrl from './Reveal.ogg';
import tickUrl from './Tick.ogg';
import alarmUrl from './Alarm.ogg';
import cardUrl from './Card.ogg';
import whooshUrl from './Whoosh.ogg';
import breakUrl from './Break.ogg';
import enchantUrl from './Enchant.ogg';
import sadUrl from './Sad.ogg';
import eatUrl from './Eat.ogg';

export type SoundName =
  | 'Pop'
  | 'Pling'
  | 'Tick'
  | 'Alarm'
  | 'Card'
  | 'Whoosh'
  | 'Reveal'
  | 'Break'
  | 'Enchant'
  | 'Sad'
  | 'Eat';

export const SoundNames: readonly SoundName[] = [
  'Pop',
  'Pling',
  'Tick',
  'Alarm',
  'Card',
  'Whoosh',
  'Reveal',
  'Break',
  'Enchant',
  'Sad',
  'Eat',
];

export const Sources: Record<SoundName, string> = {
  Pop: popUrl,
  Pling: plingUrl,
  Tick: tickUrl,
  Alarm: alarmUrl,
  Card: cardUrl,
  Whoosh: whooshUrl,
  Reveal: revealUrl,
  Break: breakUrl,
  Enchant: enchantUrl,
  Sad: sadUrl,
  Eat: eatUrl,
};

/** Per clip, since the countdown's beat sits under the words rather than beside them: a tick at
 * press loudness would be a sound every second that nobody chose to make. */
export const Volumes: Record<SoundName, number> = {
  Pop: 0.3,
  Pling: 0.3,
  Tick: 0.03,
  Alarm: 0.11,
  Card: 0.3,
  Whoosh: 0.22,
  Reveal: 0.22,
  Break: 0.3,
  Enchant: 0.3,
  Sad: 0.3,
  Eat: 0.3,
};

/** How far either side of the recorded pitch a press may land, in semitones. Wide enough that
 * two presses in a row are two notes rather than one wobbling note, and narrow enough that a
 * fifth still read as the same clip. Detuning costs no time, since it keeps length. */
const PressPitchSpread = 2.5;

/** Narrower than a press: these are not separate events the player chose, and a clock that
 * wanders by a quarter tone every second is a wobble rather than a beat. */
const TickPitchSpread = 1;

/** The alarm, the card and the whoosh have none — each happens once, and there is nothing to
 * vary it against. A card that wandered in pitch would be a second card waiting to be seen. The
 * reveal has one: a board deals up to twelve of them, and twelve of one note is a printed loop. */
export const PitchSpreads: Record<SoundName, number> = {
  Pop: PressPitchSpread,
  Pling: PressPitchSpread,
  Tick: TickPitchSpread,
  Alarm: 0,
  Card: 0,
  Whoosh: 0,
  Reveal: PressPitchSpread,
  /** A board can strike up to twelve cards in a run, and twelve of one note is the same printed
   * loop the reveal would be, so this one wanders like the reveal does. */
  Break: PressPitchSpread,
  /** Once a round, and it is the arrival itself: a clip that wandered in pitch would say the
   * enchantment reached somebody a shade other players reached. */
  Enchant: 0,
  /** Once a card, and it is the card itself being told it was worth nothing: a clip that
   * wandered in pitch would say the round judged two different answers differently. */
  Sad: 0,
  /** Once a seat, and it is the moment a card pays the player: a clip that wandered in pitch
   * would say the round valued two different answers differently, which it did not. */
  Eat: 0,
};
