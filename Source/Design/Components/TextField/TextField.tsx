import styles from './TextField.module.css';
import { useGlintVariant, type GlintVariant } from '../Glint';

export type TextFieldVariant = 'Bare' | 'Filled' | 'Sent' | 'Unmet' | 'Underline';

export interface TextFieldProps {
  variant?: TextFieldVariant;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Off unless a caller asks for it. The limit belongs to whatever the field is for, and that
   * limit is data rather than design, so this component does not guess one. */
  maxLength?: number;
  /** Shows the field as invalid and reveals the message below it. */
  error?: boolean;
  /** Message shown under the field while it is invalid. */
  errorText?: string;
  /** Opens a numeric keypad on a phone for fields that only take digits. */
  inputMode?: 'text' | 'numeric';
  /** Shows the field and does not let it be typed into: it is there to be read and to be filled
   * in by keys of the game's own, which send their letters to it rather than the browser. A
   * read-only field takes the focus and holds the value without the browser editing it. */
  readOnly?: boolean;
  /** Fills the words with the round's glint instead of ink, the shine an enchanted card lays on
   * whoever it reaches. The text is the mask, so the field itself stays as bare as it was. */
  glinted?: boolean;
  /** Why the field is closed or not, read out of the DOM for a bug this size. Named with `data-`
   * so it is not a property of the field and cannot be mistaken for one. */
  'data-why'?: string;
  onChange?: (value: string) => void;
}

/** The field's classes: the variant it is drawn as, the error it shows, and the glint's tile
 * when the round's enchanted card reaches whoever is writing in it. */
function fieldClasses(
  variant: TextFieldVariant,
  error: boolean,
  glinted: boolean,
  glint: GlintVariant
): string {
  return [
    styles.Root,
    styles[`Variant${variant}`],
    error ? styles.Error : '',
    glinted ? styles.Glinted : '',
    glinted ? styles[`Glint${glint}`] : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function TextField({
  variant = 'Filled',
  value = '',
  placeholder = '',
  disabled = false,
  maxLength,
  error = false,
  errorText = '',
  inputMode = 'text',
  readOnly = false,
  glinted = false,
  onChange,
}: TextFieldProps) {
  const glint = useGlintVariant();
  const classes = fieldClasses(variant, error, glinted, glint);

  return (
    <div class={styles.Field}>
      <input
        class={classes}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxlength={maxLength}
        inputmode={inputMode}
        readonly={readOnly}
        aria-invalid={error}
        aria-readonly={readOnly}
        onInput={(event) => onChange?.(event.currentTarget.value)}
      />
      {error && errorText.length > 0 && <span class={styles.ErrorText}>{errorText}</span>}
    </div>
  );
}
