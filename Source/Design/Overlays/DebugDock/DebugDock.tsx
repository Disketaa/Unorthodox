import { Stack } from "@/Design/Primitives";
import { Banner, Button } from "@/Design/Components";
import styles from "./DebugDock.module.css";

export interface DebugDockProps {
  /** False until the host presses "*", which is the only thing that brings the dock. */
  enabled: boolean;
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
 *
 * Renders nothing at all while the flag is off, which is the whole of the guarantee
 * that a guest never sees any of this: there is no empty dock left behind to notice.
 */
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
    </div>
  );
}
