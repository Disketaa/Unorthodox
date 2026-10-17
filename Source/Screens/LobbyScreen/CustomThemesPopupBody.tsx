import { CustomTheme } from '@/Core';
import { useCustomThemesBodyState } from './UseCustomThemesBodyState';
import { createCustomThemesHandlers } from './CreateCustomThemesHandlers';
import { CustomThemesPopupContent } from './CustomThemesPopupContent';

export function CustomThemesPopupBody({
  initialJson,
  initialProblem,
  initialName,
  onClose,
  onSave,
  onDelete,
}: {
  initialJson?: string;
  initialProblem?: string;
  initialName?: string;
  onClose: () => void;
  onSave: (themes: readonly CustomTheme[]) => void;
  onDelete?: () => void;
}) {
  const state = useCustomThemesBodyState({ initialJson, initialProblem, initialName });
  const handlers = createCustomThemesHandlers({
    json: state.json,
    themes: state.themes,
    clash: state.clash,
    onSave,
    setJson: state.setJson,
    initialName,
    setOpened: state.setOpened,
    setCopyFailed: state.setCopyFailed,
  });
  return (
    <CustomThemesPopupContent
      state={state}
      handlers={handlers}
      onClose={onClose}
      onDelete={onDelete}
    />
  );
}
