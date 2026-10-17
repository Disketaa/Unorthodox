import { handlePaste } from './UseCustomThemesBodyState';
import { CustomThemesPanel } from './CustomThemesPanel';

export function CustomThemesPopupContent({
  state,
  handlers,
  onClose,
  onDelete,
}: {
  state: ReturnType<typeof import('./UseCustomThemesBodyState').useCustomThemesBodyState>;
  handlers: ReturnType<
    typeof import('./CreateCustomThemesHandlers').createCustomThemesHandlers
  >;
  onClose: () => void;
  onDelete?: () => void;
}) {
  return (
    <CustomThemesPanel
      title={state.title}
      titleColor={state.titleColor}
      error={state.error}
      copyFailed={state.copyFailed}
      themes={state.themes}
      valid={state.valid}
      json={state.json}
      buttons={{
        onClose,
        onSave: handlers.doSave,
        onCopyPrompt: handlers.doCopyPrompt,
        onDelete,
        emptied: state.json.trim().length === 0,
        disabled: !state.valid,
        hintBefore: state.hintBefore,
        hintName: state.hintName,
        hintTail: state.hintTail,
      }}
      editor={{ edit: handlers.edit, handlePaste }}
    />
  );
}
