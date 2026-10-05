import { CharacterColor } from '@/Core';
import styles from './ColorSwatch.module.css';

export type ColorSwatchSize = 'Small' | 'Medium' | 'Large' | 'Fill';
export type ColorSwatchShape = 'Circle' | 'Square';

export interface ColorSwatchProps {
  color: CharacterColor;
  size?: ColorSwatchSize;
  /** How the block of colour is cut. `Square` matches the radius of a button, for a cell that is
   * already square; `Circle` is a disc on its own, and carries its own outline so it does not
   * disappear into a pale surface. */
  shape?: ColorSwatchShape;
}

/** One tint, as a block of colour. `Fill` takes its size from the space it is given, which is
 * what the picker needs so a cell keeps its share of the row on a narrow screen. The named
 * sizes are fixed tokens, for places that line the swatch up with a fixed-size character.
 * Decorative: the button around it carries the tint's name, so a screen reader already
 * announces the choice. This only has to show which colour it is. */
export function ColorSwatch({
  color,
  size = 'Small',
  shape = 'Circle',
}: ColorSwatchProps) {
  const classes = [
    styles.Swatch,
    styles[`Size${size}`],
    styles[shape],
    styles[color],
  ].join(' ');
  return <span class={classes} aria-hidden="true" />;
}
