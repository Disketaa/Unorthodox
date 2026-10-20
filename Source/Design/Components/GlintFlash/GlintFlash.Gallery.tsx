import { Stack, Text } from '@/Design/Primitives';
import { GlintFlash } from './GlintFlash';
import styles from './GlintFlash.Gallery.module.css';

/** The two ways the shine goes, each on a stage of its own so the flash has something to be laid
 * over. */
export function GlintFlashGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">GlintFlash Variants</Text>
      <div class={styles.Stage}>
        <GlintFlash variant="Flash" />
      </div>
      <div class={styles.Stage}>
        <GlintFlash variant="Wash" />
      </div>
    </Stack>
  );
}
