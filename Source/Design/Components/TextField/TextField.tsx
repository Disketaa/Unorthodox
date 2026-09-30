import styles from "./TextField.module.css";

export type TextFieldVariant = "Filled" | "Underline";

export interface TextFieldProps {
  variant?: TextFieldVariant;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  onChange?: (value: string) => void;
}

export function TextField({
  variant = "Filled",
  value = "",
  placeholder = "",
  disabled = false,
  maxLength = 80,
  onChange,
}: TextFieldProps) {
  return (
    <input
      class={`${styles.Root} ${styles[`Variant${variant}`]}`}
      type="text"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      maxlength={maxLength}
      onInput={(event) => onChange?.(event.currentTarget.value)}
    />
  );
}