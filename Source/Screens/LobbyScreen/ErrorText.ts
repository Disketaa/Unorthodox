import { Strings } from '@/Content';
import { type CustomThemesError } from '@/Core';

/** The banner's wording: the error place first, the fault after it. A shape error states the
 * requirement; a parser error passes the parser's own words through. */
export function errorText(problem: CustomThemesError | undefined): string | undefined {
  if (problem === undefined) return undefined;
  const settings = Strings.lobby.settings;
  if (problem.kind === 'shape') return settings.customThemesInvalidTheme;
  if (problem.kind === 'parser') return problem.message;
  const { reason, line, column } = problem.problem;
  return `${settings.customThemesJsonProblemAt(line, column)}, ${settings.customThemesJsonProblems[reason]}`;
}
