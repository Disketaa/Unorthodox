import { TextField } from './TextField';
import { Stack } from '@/Design/Primitives';
import { Text } from '@/Design/Primitives';
import { useState } from 'preact/hooks';

export function TextFieldGallery() {
  const [value, setValue] = useState('');

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
      <TextField
        variant="Filled"
        value={value}
        placeholder="With an error"
        error
        errorText="Показывает, что поле пустое"
        onChange={setValue}
      />
      <TextField
        variant="Filled"
        value="1234"
        placeholder="Numeric"
        inputMode="numeric"
        onChange={setValue}
      />
      <Text variant="Body">Glinted While Unmet</Text>
      <TextField variant="Bare" value="Зачарован" glinted readOnly onChange={() => {}} />
    </Stack>
  );
}
