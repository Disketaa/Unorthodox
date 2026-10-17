import { Strings, themePrompt } from '@/Content';
import {
  CustomTheme,
  themeNameIsTaken,
  savedCustomThemes,
  normalizeCustomThemesJson,
  parseCustomThemesJson,
} from '@/Core';

function repair(text: string): string | undefined {
  return parseCustomThemesJson(text) === undefined
    ? normalizeCustomThemesJson(text, Strings.lobby.settings.customThemesDefaultName)
    : undefined;
}

function handleSave({
  json,
  themes,
  clash,
  onSave,
  setJson,
  initialName,
}: {
  json: string;
  themes: CustomTheme[] | undefined;
  clash: string | undefined;
  onSave: (themes: readonly CustomTheme[]) => void;
  setJson: (next: string) => void;
  initialName?: string;
}): void {
  if (clash !== undefined) return;
  if (themes === undefined) {
    const repaired = repair(json);
    const rescued = repaired === undefined ? undefined : parseCustomThemesJson(repaired);
    if (repaired === undefined || rescued === undefined) return;
    if (rescued.some((theme) => themeNameIsTaken(theme.name, savedCustomThemes(), initialName)))
      return;
    setJson(repaired);
    onSave(rescued);
    return;
  }
  onSave(themes);
}

async function handleCopyPrompt(themes: CustomTheme[] | undefined): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(themePrompt(themes?.[0]?.name));
    return false;
  } catch {
    return true;
  }
}

export function createCustomThemesHandlers({
  json,
  themes,
  clash,
  onSave,
  setJson,
  initialName,
  setOpened,
  setCopyFailed,
}: {
  json: string;
  themes: CustomTheme[] | undefined;
  clash: string | undefined;
  onSave: (themes: readonly CustomTheme[]) => void;
  setJson: (next: string) => void;
  initialName?: string;
  setOpened: (problem: string | undefined) => void;
  setCopyFailed: (failed: boolean) => void;
}) {
  const doSave = (): void => handleSave({ json, themes, clash, onSave, setJson, initialName });
  const doCopyPrompt = (): void => {
    handleCopyPrompt(themes).then((failed) => setCopyFailed(failed));
  };
  const edit = (next: string): void => {
    setOpened(undefined);
    setJson(next);
  };
  return { doSave, doCopyPrompt, edit };
}
