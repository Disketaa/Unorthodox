import { Stack, Text, usePageEnter } from '@/Design/Primitives';
import { ComponentType } from 'preact';
import styles from './GalleryPage.module.css';

interface GalleryModule {
  [name: string]: ComponentType;
}

const galleryModules = import.meta.glob<GalleryModule>('../../Design/**/*.Gallery.tsx', {
  eager: true,
});

export function GalleryPage() {
  // The gallery brings its own frame rather than a `Screen`, so it asks for the
  // fade itself.
  usePageEnter();

  return (
    <div className={styles.Root}>
      <Stack direction="Vertical" gap="Lg" padding="Xl" align="Center">
        <Text variant="Title">Component Gallery</Text>
        <Stack direction="Vertical" gap="Md">
          {Object.entries(galleryModules).map(([path, module]) => {
            const componentName =
              path.split('/').pop()?.replace('.Gallery.tsx', '') || 'Unknown';
            // Named after the file rather than a default export: `Banner.Gallery.tsx` holds
            // `BannerGallery`, and a default here would be one more convention to keep to.
            const Component = module[`${componentName}Gallery`];
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
