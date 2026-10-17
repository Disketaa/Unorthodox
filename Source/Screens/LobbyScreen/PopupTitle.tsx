import styles from './CustomThemesPopup.module.css';

/** The theme's name above the editor, drawn in the theme's own tint when it has one. */
export function PopupTitle({ title, color }: { title: string; color: string | undefined }) {
  return (
    <span
      class={styles.title}
      style={{ color, fontFamily: 'var(--FontFamily-Display)', fontSize: 'var(--FontSize-H1)' }}
    >
      {title}
    </span>
  );
}
