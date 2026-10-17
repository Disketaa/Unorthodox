import { Separator } from '@/Design/Primitives';
import { Strings } from '@/Content';
import { SyntaxHighlightedJson } from './CustomThemesPopupSyntax';

export function EditorSection({
  json,
  edit,
  handlePaste,
  titleColor,
  valid,
  rounds,
}: {
  json: string;
  edit: (next: string) => void;
  handlePaste: (text: string) => string | undefined;
  titleColor: string | undefined;
  valid: boolean;
  rounds: number;
}) {
  return (
    <>
      <Separator>{Strings.lobby.settings.customThemesRounds(rounds)}</Separator>
      <SyntaxHighlightedJson
        json={json}
        onChange={edit}
        onPaste={handlePaste}
        onClear={() => edit('')}
        color={titleColor}
        invalid={!valid}
        label={Strings.lobby.settings.customThemes}
      />
    </>
  );
}
