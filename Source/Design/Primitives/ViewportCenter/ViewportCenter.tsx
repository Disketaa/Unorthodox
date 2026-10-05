import { ComponentChildren } from 'preact';
import { useCallback, useRef } from 'preact/hooks';
import { useViewportMeasure } from '../UseViewportMeasure';
import styles from './ViewportCenter.module.css';

export interface ViewportCenterProps {
  children?: ComponentChildren;
}

/** The custom property the stylesheet reads the height above out of. */
const Above = '--ViewportCenter-Above';

/** A child centred in the viewport rather than in the room left below whatever is above it.
 * Centring is normally a matter of growing into the space a parent has left and centring inside
 * it, which is wrong whenever anything sits above: the child is then centred in what remains,
 * so everything at the top of the game pushes it further down, and by half as much again as it
 * is tall. What has to be centred is the viewport, and only the viewport. So the space above is
 * measured and given back. `flex: 1` takes what is left of the stage, `margin-top` takes half
 * the height above off the top, and the child is centred in what remains of the two — the
 * middle of the screen. The half is the whole of it: a stage with `a` above the child and `b`
 * below it centres the child in the middle of `a + b`, which is half a bar too low exactly when
 * `a` is half a bar, so pulling up by half of `a` puts it back on the middle. Measured as this
 * element's own offset from the top of its positioned ancestor rather than by summing the
 * siblings above it, so the number of things at the top of the game does not matter and adding
 * one is not a change to make here. A sibling list would have needed every future element above
 * the stage added to it, and the count would have been wrong from the first addition. A custom
 * property rather than a value read here and applied, because the balance is a layout fact and
 * belongs in the stylesheet with the rest of it. The fallback is zero, so before anything has
 * been measured this is an ordinary centred row: too low by half the height above it for one
 * frame, which is not worth a mechanism to avoid. */
export function ViewportCenter({ children }: ViewportCenterProps) {
  const root = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const node = root.current;
    if (node === null) {
      return;
    }
    node.style.setProperty(Above, `${node.offsetTop}px`);
  }, []);

  useViewportMeasure(root, measure);

  return (
    <div class={styles.Root} ref={root}>
      {children}
    </div>
  );
}
