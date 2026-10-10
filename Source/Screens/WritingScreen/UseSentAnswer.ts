import { useState } from 'preact/hooks';
import { playSound } from '@/Design';

/** What was last sent, and whether the field has been touched since. Kept rather than compared
 * with what is in the field, since typing past an answer and deleting back to it would look
 * sent again and turn words yellow that nobody sent. */
export function useSentAnswer(
  value: string,
  onValueChange: (value: string) => void,
  onSubmit: () => void
) {
  const [sent, setSent] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  return {
    // Whether the field holds exactly what was sent, which is what it reads as.
    clean: !touched && sent === value,
    // Writing over an answer already sent: back at work on a round they had finished, which the
    // room cannot see on its own and so has to be told.
    editing: sent !== undefined && (touched || sent !== value),
    change: (next: string) => {
      setTouched(true);
      onValueChange(next);
    },
    send: () => {
      setSent(value);
      setTouched(false);
      playSound('Submit');
      onSubmit();
    },
  };
}
