import { CustomTheme } from '@/Core';
import { PopupHeader } from './PopupHeader';
import { EditorSection } from './EditorSection';
import { CustomButtons } from './CustomButtons';
import styles from './CustomThemesPopup.module.css';

type PanelButtons = {
  onClose: () => void;
  onSave: () => void;
  onCopyPrompt: () => void;
  onDelete?: () => void;
  emptied: boolean;
  disabled: boolean;
  hintBefore: string;
  hintName: string;
  hintTail: string;
};

type PanelEditor = {
  edit: (next: string) => void;
  handlePaste: (text: string) => string | undefined;
};

type PanelProps = {
  title: string;
  titleColor: string | undefined;
  error: string | undefined;
  copyFailed: boolean;
  themes: CustomTheme[] | undefined;
  valid: boolean;
  json: string;
  buttons: PanelButtons;
  editor: PanelEditor;
};

export function CustomThemesPanel(props: PanelProps) {
  const { title, titleColor, error, copyFailed, themes, valid, json, buttons, editor } = props;
  return (
    <div class={styles.Root}>
      <div class={styles.Veil} onClick={buttons.onClose} />
      <div class={styles.Panel}>
        <PopupHeader
          title={title}
          titleColor={titleColor}
          error={error}
          copyFailed={copyFailed}
        />
        <EditorSection
          json={json}
          edit={editor.edit}
          handlePaste={editor.handlePaste}
          titleColor={titleColor}
          valid={valid}
          rounds={themes?.[0]?.questions?.length ?? 0}
        />
        <CustomButtons
          hintBefore={buttons.hintBefore}
          hintName={buttons.hintName}
          hintTail={buttons.hintTail}
          emptied={buttons.emptied}
          onClose={buttons.onClose}
          onSave={buttons.onSave}
          onCopyPrompt={buttons.onCopyPrompt}
          onDelete={buttons.onDelete ?? (() => undefined)}
          disabled={buttons.disabled}
        />
      </div>
    </div>
  );
}
