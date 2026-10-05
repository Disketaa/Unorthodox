import { ComponentChildren } from 'preact';
import { useCallback, useRef } from 'preact/hooks';
import { useViewportMeasure } from '../UseViewportMeasure';
import styles from './ViewportCenter.module.css';

export interface ViewportCenterProps {
  children?: ComponentChildren;
}

/** The custom property the stylesheet reads the height above out of. */
const Above = '--ViewportCenter-Above';

/** A child centred in the viewport rather than in the room left below whatever is above it. The
 * space above is measured and given back: `flex: 1` takes what is left of the stage and
 * `margin-top` takes half the height above off the top, which is exactly the half it sat low. */
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
