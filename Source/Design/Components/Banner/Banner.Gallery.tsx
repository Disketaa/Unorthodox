import { Banner } from "./Banner";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";

export function BannerGallery() {
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">Banner Variants</Text>
      <Banner variant="Info">This is an info banner</Banner>
      <Banner variant="Success">Success! Operation completed</Banner>
      <Banner variant="Warning">Warning: Please check your input</Banner>
      <Banner variant="Error">Error: Something went wrong</Banner>
      <Text variant="Body">Banner Alignment</Text>
      <Stack direction="Horizontal" gap="Sm">
        <Banner variant="Info">Left by default</Banner>
        <Banner variant="Info" align="Center">Centred</Banner>
      <Text variant="Body">Banner Marks</Text>
      <Banner variant="Info">The default mark</Banner>
      <Banner variant="Info" mark="Loading">
        The spinning mark
      </Banner>
    </Stack>
    </Stack>
  );
}