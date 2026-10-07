import { Pop } from './Pop';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';
import styles from './Pop.Gallery.module.css';

export function PopGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">The pop, on every reaction</Text>
      <Text variant="Caption">
        Reload the page to see it run. The second and third wait their turn, so the row ripples
        instead of moving together.
      </Text>
      <Stack direction="Horizontal" gap="Lg" align="End">
        <Pop trigger="a">
          <span class={styles.Mark} />
        </Pop>
        <Pop trigger="b" index={2}>
          <span class={styles.Mark} />
        </Pop>
        <Pop trigger="c" index={4}>
          <span class={`${styles.Mark} ${styles.Other}`} />
        </Pop>
      </Stack>
    </Stack>
  );
}
