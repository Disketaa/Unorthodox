import styles from "./PaperBackground.module.css";
import paperVideo from "../Paper.mp4";

/**
 * A looping paper texture laid over the whole app.
 *
 * The video is decorative only, so it is muted, non-interactive and hidden from
 * assistive technology. It is blended into the interface rather than placed
 * behind it, so the texture moves across cards, buttons and text as well.
 */
export function PaperBackground() {
  return (
    <div class={styles.Root} aria-hidden="true">
      <video class={styles.Video} autoPlay loop muted playsInline preload="auto">
        <source src={paperVideo} type="video/mp4" />
      </video>
    </div>
  );
}
