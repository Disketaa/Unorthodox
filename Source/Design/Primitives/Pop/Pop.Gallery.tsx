import { Pop } from "./Pop";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";
import styles from "./Pop.Gallery.module.css";

export function PopGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Appear grows from nothing; Effort only squashes.</Text>
      <Text variant="Caption">Reload the page to see either one run again.</Text>
      <Stack direction="Horizontal" gap="Lg" align="End">
        <Pop trigger="a" variant="Appear">
          <span class={styles.Mark} />
        </Pop>
        <Pop trigger="a" variant="Effort">
          <span class={styles.Mark} />
        </Pop>
      </Stack>
    </Stack>
  );
}
