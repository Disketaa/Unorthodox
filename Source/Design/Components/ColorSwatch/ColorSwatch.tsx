import { CharacterColor } from '@/Core';
import styles from './ColorSwatch.module.css';

export type ColorSwatchSize = 'Small' | 'Medium' | 'Large' | 'Fill';

export interface ColorSwatchProps {
  color: CharacterColor;
  size?: ColorSwatchSize;
}

/**
 * One tint, as a disc.
 *
 * `Fill` takes its size from the space it is given, which is what the picker
 * needs so the row keeps its padding on a narrow screen. The named sizes are
 * fixed tokens, for places that line the disc up with a fixed-size character.
 *
 * Decorative: the button around it carries the tint's name, so a screen reader
 * already announces the choice. This only has to show which colour it is.
 */
export function ColorSwatch({ color, size = 'Small' }: ColorSwatchProps) {
  const classes = [styles.Swatch, styles[`Size${size}`], styles[color]].join(' ');
  return <span class={classes} aria-hidden="true" />;
}
