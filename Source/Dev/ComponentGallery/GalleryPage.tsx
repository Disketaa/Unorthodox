import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";
import { ComponentType } from "preact";
import styles from "./GalleryPage.module.css";

interface GalleryModule {
  default: ComponentType;
}

const galleryModules = import.meta.glob<GalleryModule>("../../Design/**/*.Gallery.tsx", { eager: true });

export function GalleryPage() {
  return (
    <div className={styles.Root}>
      <Stack direction="Vertical" gap="Lg" padding="Xl" align="Center">
        <Text variant="Title">Component Gallery</Text>
        <Stack direction="Vertical" gap="Md">
          {Object.entries(galleryModules).map(([path, module]) => {
            const Component = module.default;
            // Extract component name from path
            const componentName = path.split("/").pop()?.replace(".Gallery.tsx", "") || "Unknown";
            return (
              <div key={path} className={styles.Item}>
                <Text variant="Body" fontWeight="Bold">
                  {componentName}
                </Text>
                <div className={styles.Component}>
                  <Component />
                </div>
              </div>
            );
          })}
        </Stack>
      </Stack>
    </div>
  );
}