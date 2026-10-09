import styles from './TextField.module.css';

export type TextFieldVariant = 'Filled' | 'Underline';

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
  onChange?: (value: string) => void;
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
  onChange,
}: TextFieldProps) {
  return (
    <div class={styles.Field}>
      <input
        class={`${styles.Root} ${styles[`Variant${variant}`]} ${error ? styles.Error : ''}`}
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        maxlength={maxLength}
        inputmode={inputMode}
        aria-invalid={error}
        onInput={(event) => onChange?.(event.currentTarget.value)}
      />
      {error && errorText.length > 0 && <span class={styles.ErrorText}>{errorText}</span>}
    </div>
  );
}
