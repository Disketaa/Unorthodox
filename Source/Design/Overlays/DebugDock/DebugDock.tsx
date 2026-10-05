import { ComponentChildren } from "preact";
import { Stack } from "@/Design/Primitives";
import { Banner, Card } from "@/Design/Components";
import styles from "./DebugDock.module.css";

export interface DebugDockProps {
  /** False until the host presses "*", which is the only thing that brings the dock. */
  enabled: boolean;
  /** Says the logging is on, since nothing else on the screen moved when it did. */
  label: string;
  /** What this screen offers, which is a different set on every screen: the lobby can add a
   * player, and a screen with nothing to offer passes nothing and shows the note on its own.
   * The dock decides where the controls sit, never what they do. */
  children?: ComponentChildren;
}

/** The host's console: a note that logging is on, and the controls for the screen. Mounted once
 * for the whole room rather than by any one screen, since the flag is the host's and does not
 * go away when the phase does. What it holds changes with the screen; where it holds does not. */
export function DebugDock({ enabled, label, children }: DebugDockProps) {
  if (!enabled) return null;
  return (
    <div class={styles.Root}>
      <Card variant="Outlined">
        <Stack gap="Sm">
          <Banner variant="Accent" mark="Info">
            {label}
          </Banner>
          {children}
        </Stack>
      </Card>
    </div>
  );
}
