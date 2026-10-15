import { useEffect, useRef, useState } from 'preact/hooks';
import { playSound } from '@/Design';

/** What was last sent, and whether the field has been touched since. Kept rather than compared
 * with what is in the field, since typing past an answer and deleting back to it would look
 * sent again and turn words yellow that nobody sent. Reports being back at work upward. */
export function useSentAnswer(
  value: string,
  onValueChange: (value: string) => void,
  onSubmit: () => void,
  onEditing?: (editing: boolean) => void
) {
  const [sent, setSent] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  // Writing over an answer already sent: back at work on a round they had finished, which the
  // room cannot see on its own and so has to be told.
  const editing = sent !== undefined && (touched || sent !== value);
  // Held in a ref so the effect turns on the flag and not the callback's identity: a fresh
  // callback each render would re-fire it every frame, and firing it tells the room.
  const report = useRef(onEditing);
  report.current = onEditing;
  useEffect(() => {
    report.current?.(editing);
  }, [editing]);
  return {
    // Whether the field holds exactly what was sent, which is what it reads as.
    clean: !touched && sent === value,
    editing,
    change: (next: string) => {
      setTouched(true);
      onValueChange(next);
    },
    send: () => {
      setSent(value);
      setTouched(false);
      playSound('Card');
      onSubmit();
    },
  };
}
