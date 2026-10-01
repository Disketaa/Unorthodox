<<<<<<< HEAD
import { ComponentChildren } from "preact";
import { Stack } from "@/Design/Primitives";
import { Banner, Card } from "@/Design/Components";
=======
import { Stack } from "@/Design/Primitives";
import { Banner, Button } from "@/Design/Components";
>>>>>>> fb8341a6de10eefc021414c18150bade904ce026
import styles from "./DebugDock.module.css";

export interface DebugDockProps {
  /** False until the host presses "*", which is the only thing that brings the dock. */
  enabled: boolean;
<<<<<<< HEAD
  /** Says the logging is on, since nothing else on the screen moved when it did. */
  label: string;
  /**
   * What this screen offers, which is a different set on every screen: the lobby can
   * add a player, and a screen with nothing to offer passes nothing and shows the note
   * on its own. The dock decides where the controls sit, never what they do.
   */
  children?: ComponentChildren;
}

/**
 * The host's console: a note that logging is on, and the controls for the screen.
 *
 * Mounted once for the whole room rather than by any one screen, because the flag is
 * the host's and does not go away when the phase does — a host who wants to watch the
 * connection does not want to find the key has stopped working the moment the game
 * starts. What the dock holds changes with the screen; where it holds it does not.
 *
 * Pinned to the foot of the window rather than laid into the page, since none of it
 * belongs to the room: the room is playing, and the tools a host uses to watch the
 * room are not part of it. Fixed rather than absolute so it stays at the foot of the
 * window however tall the page grows, and centred on the window rather than on the
 * page's column, so it reads as the window's own furniture.
 *
 * A `Card` like any other container, with the note and the controls stacked in it,
 * because a host's furniture that looked like nothing else on the page would read as
 * part of the game rather than as a tool laid over it.
=======
  /** False in a full room, where a bot would have no seat to sit in. */
  canAddBot: boolean;
  /** Says the logging is on, since nothing else on screen moved when it did. */
  label: string;
  addBotLabel: string;
  onAddBot: () => void;
}

/**
 * The host's console, as a thing on the screen.
 *
 * A dock at the foot of the viewport rather than a card inside the lobby, because
 * none of it belongs to the room: the room is playing, and the tools a host uses to
 * watch the room are not part of it. Fixed rather than absolute so it stays at the
 * foot of the window however tall the page grows, and centred on the window rather
 * than on the lobby's column, so it reads as the window's own furniture.
 *
 * It takes its words as labels, the way the design system's components take theirs:
 * this file is design, and the wording is Content's.
>>>>>>> fb8341a6de10eefc021414c18150bade904ce026
 *
 * Renders nothing at all while the flag is off, which is the whole of the guarantee
 * that a guest never sees any of this: there is no empty dock left behind to notice.
 */
<<<<<<< HEAD
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
=======
export function DebugDock({
  enabled,
  canAddBot,
  label,
  addBotLabel,
  onAddBot,
}: DebugDockProps) {
  if (!enabled) return null;
  return (
    <div class={styles.Root}>
      <Stack direction="Horizontal" gap="Sm" align="Center">
        <Banner variant="Accent" mark="Info">
          {label}
        </Banner>
        {canAddBot && (
          <Button variant="Primary" size="Small" sound={false} onClick={onAddBot}>
            {addBotLabel}
          </Button>
        )}
      </Stack>
>>>>>>> fb8341a6de10eefc021414c18150bade904ce026
    </div>
  );
}
