import { ComponentChildren, TargetedMouseEvent } from 'preact';
import { Stack } from '@/Design/Primitives';
import { Card } from '@/Design/Components';
import styles from './DebugDock.module.css';

/** A focused button answers the next Enter to itself, so a dock button left holding the focus
 * would step the phase again instead of letting the player send what was typed. The dock is
 * pressed with the mouse and is not part of the game the keyboard is driving, so it lets go. */
function releaseFocus(event: TargetedMouseEvent<HTMLDivElement>): void {
  if (!(event.target instanceof Element)) return;
  event.target.closest('button')?.blur();
}

export interface DebugDockProps {
  /** False until the host presses "", which is the only thing that brings the dock. */
  enabled: boolean;
  /** What this screen offers, which is a different set on every screen: the lobby can add a
   * player, a screen mid-round can move the turn on or step past the phase. The dock draws them
   * as one row of squares and never decides which belong here. */
  children?: ComponentChildren;
}

/** The host's console: the controls for the screen, in one row. Mounted once for the whole room
 * rather than by any one screen, since the flag is the host's and does not go away when the
 * phase does. What it holds changes with the screen; where it holds does not. */
export function DebugDock({ enabled, children }: DebugDockProps) {
  if (!enabled) return null;
  return (
    <div class={styles.Root} onClick={releaseFocus}>
      <Card variant="Outlined">
        <Stack direction="Horizontal" gap="Xs" align="Center">
          {children}
        </Stack>
      </Card>
    </div>
  );
}
