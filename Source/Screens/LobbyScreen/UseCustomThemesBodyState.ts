import { useState } from 'preact/hooks';
import { Strings } from '@/Content';
import {
  CustomTheme,
  Accents,
  themeNameIsTaken,
  savedCustomThemes,
  normalizeCustomThemesJson,
  parseCustomThemesJson,
  customThemesJsonError,
  hasJsonFence,
} from '@/Core';
import { errorText } from './ErrorText';
import { DefaultJson } from './DefaultJson';

function repair(text: string): string | undefined {
  return parseCustomThemesJson(text) === undefined
    ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
    : undefined;
}

export function handlePaste(text: string): string | undefined {
  return hasJsonFence(text)
    ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
    : repair(text);
}

function computeClash(
  themes: CustomTheme[] | undefined,
  initialName?: string
): string | undefined {
  return themes?.[0] !== undefined &&
    themeNameIsTaken(themes[0].name, savedCustomThemes(), initialName)
    ? Strings.lobby.settings.customThemesNameClash
    : undefined;
}

function computeHint(json: string): { hintBefore: string; hintName: string; hintTail: string } {
  const themes = parseCustomThemesJson(json);
  const [hintBefore, ...hintAfter] =
    Strings.lobby.settings.customThemesCopyPromptHint.split('{name}');
  const hintName = themes?.[0]?.name ?? '';
  const hintTail = hintAfter.join('{name}');
  return { hintBefore, hintName, hintTail };
}

function computeTitleAndColor(
  themes: CustomTheme[] | undefined,
  invalid: boolean
): { title: string; titleColor: string | undefined } {
  if (themes === undefined) {
    return {
      title: Strings.lobby.settings.customThemesErrorTitle,
      titleColor: 'var(--Color-Feedback-Error)',
    };
  }
  const title = invalid
    ? Strings.lobby.settings.customThemesErrorTitle
    : (themes[0]?.name ?? Strings.lobby.settings.customThemesTitle);
  const titleColor = invalid
    ? 'var(--Color-Feedback-Error)'
    : themes[0]?.color
      ? Accents[themes[0].color].tint
      : undefined;
  return { title, titleColor };
}

export function useCustomThemesBodyState({
  initialJson,
  initialProblem,
  initialName,
}: {
  initialJson?: string;
  initialProblem?: string;
  initialName?: string;
}) {
  const [json, setJson] = useState(initialJson ?? DefaultJson);
  const [copyFailed, setCopyFailed] = useState(false);
  const [opened, setOpened] = useState(initialProblem);

  const themes = parseCustomThemesJson(json);
  const clash = computeClash(themes, initialName);
  const invalid = themes === undefined || clash !== undefined;
  const { title, titleColor } = computeTitleAndColor(themes, invalid);
  const valid = themes !== undefined && clash === undefined;
  const { hintBefore, hintName, hintTail } = computeHint(json);
  const error = opened ?? clash ?? errorText(customThemesJsonError(json));

  return {
    json,
    setJson,
    copyFailed,
    setCopyFailed,
    setOpened,
    themes,
    clash,
    title,
    titleColor,
    valid,
    hintBefore,
    hintName,
    hintTail,
    error,
  };
}
