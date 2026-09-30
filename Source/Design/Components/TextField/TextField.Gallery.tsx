import { TextField } from "./TextField";
import { Stack } from "@/Design/Primitives";
import { Text } from "@/Design/Primitives";
import { useState } from "preact/hooks";

export function TextFieldGallery() {
  const [value, setValue] = useState("");
  
  return (
    <Stack direction="Vertical" gap="Md">
      <Text variant="Body">TextField Variants</Text>
      <TextField
        variant="Filled"
        value={value}
        placeholder="Filled input"
        onChange={setValue}
      />
      <TextField
        variant="Underline"
        value={value}
        placeholder="Underline input"
        onChange={setValue}
      />
    </Stack>
  );
}