import { Banner } from '@/Design/Components';
import { Strings } from '@/Content';
import { PopupTitle } from './PopupTitle';
import styles from './CustomThemesPopup.module.css';

export function PopupHeader({
  title,
  titleColor,
  error,
  copyFailed,
}: {
  title: string;
  titleColor: string | undefined;
  error: string | undefined;
  copyFailed: boolean;
}) {
  return (
    <div class={styles.Header}>
      <PopupTitle title={title} color={titleColor} />
      {error !== undefined && (
        <div class={styles.HeaderNote}>
          <Banner variant="Error" fill>
            {error}
          </Banner>
        </div>
      )}
      {copyFailed && (
        <div class={styles.HeaderNote}>
          <Banner variant="Error" fill>
            {Strings.lobby.settings.customThemesCopyFailed}
          </Banner>
        </div>
      )}
    </div>
  );
}
