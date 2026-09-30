import { CharacterColor } from '@/Core';
import styles from './ColorSwatch.module.css';

export type ColorSwatchSize = 'Small' | 'Medium' | 'Large';

export interface ColorSwatchProps {
  color: CharacterColor;
  size?: ColorSwatchSize;
}

/**
 * One tint, as a disc.
 *
 * Decorative: the button around it carries the tint's name, so a screen reader
 * already announces the choice. This only has to show which colour it is.
 */
export function ColorSwatch({ color, size = 'Small' }: ColorSwatchProps) {
  const classes = [styles.Swatch, styles[`Size${size}`], styles[color]].join(' ');
  return <span class={classes} aria-hidden="true" />;
}
