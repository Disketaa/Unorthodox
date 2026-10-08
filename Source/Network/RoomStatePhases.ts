/** Which phase a stored room was in, and the state of it, read through the guards beside this. *
 * Its own file because reading a phase and guarding its fields are two different jobs, and only
 * one of them changes when a phase gains a field. */
import type { HostState, RandomPick, RoomMembers } from '@/Game';
import { isThemeId } from '@/Core';
import { toRejections } from './RoomRejections';
import {
  clockOf,
  fieldsOf,
  isNumber,
  number,
  rawPairs,
  text,
  themeFrom,
  toMap,
  type Fields,
  type Members,
} from './RoomStateCodec';

const isText = (value: unknown): value is string => typeof value === 'string';

/** The room's own roll mid-sweep, or undefined where there is none. Guarded whole, since half a
 * * pick is not a sweep any client can run. */
function pickingFrom(fields: Fields): RandomPick | undefined {
  const record = fieldsOf(fields.get('picking'));
  const theme = record.get('theme');
  const startedAt = record.get('startedAt');
  return isThemeId(theme) && isNumber(startedAt) ? { theme, startedAt } : undefined;
}

/** When the room answered its bank, where it has. A resumed room has to stop its clock where the
 * * original one stopped, or the countdown comes back after the answer. */
function answeredFrom(fields: Fields): number | undefined {
  const value = fields.get('answeredAt');
  return isNumber(value) ? value : undefined;
}

/** The two untimed phases, which carry no clock at all. */
function plainFrom(fields: Fields, members: Members): HostState | undefined {
  const { scores, players, turnPlayerId, pace, themeRounds } = members;
  switch (fields.get('phase')) {
    case 'Lobby':
      return {
        phase: 'Lobby',
        players,
        cumulativeScores: scores,
        turnPlayerId,
        pace,
        themeRounds,
      };
    case 'Final':
      return {
        phase: 'Final',
        players,
        cumulativeScores: scores,
        turnPlayerId,
        pace,
        themeRounds,
        theme: themeFrom(fields),
      };
    default:
      return undefined;
  }
}

/** The bank, which is the one timed phase carrying two moments of its own: the room's own roll *
 * and when the bank was answered. */
function choosingFrom(
  fields: Fields,
  common: RoomMembers & { durationMs: number; startedAt: number }
): HostState {
  return {
    phase: 'Choosing',
    ...common,
    theme: themeFrom(fields),
    picking: pickingFrom(fields),
    answeredAt: answeredFrom(fields),
    leadInMs: number(fields, 'leadInMs'),
  };
}

/** The three timed phases, which all read the same clock, roster and turn. */
function timedFrom(fields: Fields, members: Members): HostState | undefined {
  const { scores, players, turnPlayerId, pace, themeRounds } = members;
  const common = {
    ...clockOf(fields),
    topic: text(fields, 'topic'),
    answers: toMap(rawPairs(fields, 'answers'), isText),
    players,
    cumulativeScores: scores,
    turnPlayerId,
    pace,
    themeRounds,
  };
  const theme = themeFrom(fields);
  switch (fields.get('phase')) {
    case 'Choosing':
      return choosingFrom(fields, common);
    case 'Writing':
      return { phase: 'Writing', ...common, theme };
    case 'Reviewing':
      return { phase: 'Reviewing', ...common, groupRejections: toRejections(fields), theme };
    case 'Scores':
      return {
        phase: 'Scores',
        ...clockOf(fields),
        scores: toMap(rawPairs(fields, 'round'), isNumber),
        players,
        cumulativeScores: scores,
        turnPlayerId,
        pace,
        themeRounds,
        theme,
      };
    default:
      return undefined;
  }
}

/** The stored state, or undefined when what was in storage is not a phase this build can resume. */
export function phaseFrom(fields: Fields, members: Members): HostState | undefined {
  return plainFrom(fields, members) ?? timedFrom(fields, members);
}
