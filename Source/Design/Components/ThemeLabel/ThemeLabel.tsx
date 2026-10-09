import styles from './ThemeLabel.module.css';

export interface ThemeLabelProps {
  theme: string;
  /** The theme's own wash and ink, for the block the name sits in. The name is the only thing in
   * the theme's colour: the question beside it is the text the room reads, and tinting that to
   * match one pill says the room is a theme rather than that the round is one. */
  accent: { wash: string; ink: string };
  /** The question it introduced, beside the name. Optional: the question stage shows the name on
   * its own above a question of its own, so asking for one here would be asking for something
   * that screen has already got. */
  topic?: string;
}

/** The round's theme named in its own colours, with the question it introduced beside it. One
 * component because both take the theme's accent and belong together, rather than each reaching
 * for it on its own. */
export function ThemeLabel({ theme, accent, topic }: ThemeLabelProps) {
  return (
    <div class={styles.Row}>
      <span class={styles.Topic}>{topic}</span>
      <span class={styles.Root} style={{ background: accent.wash, color: accent.ink }}>
        {theme}
      </span>
    </div>
  );
}
