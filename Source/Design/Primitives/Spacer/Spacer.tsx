import styles from './Spacer.module.css';

export type SpacerSize = 'Xs' | 'Sm' | 'Md' | 'Lg' | 'Xl';
export type SpacerAxis = 'Horizontal' | 'Vertical';

export interface SpacerProps {
  size?: SpacerSize;
  axis?: SpacerAxis;
}

export function Spacer({ size = 'Md', axis = 'Vertical' }: SpacerProps) {
  return <div class={`${styles.Root} ${styles[`Axis${axis}`]} ${styles[`Size${size}`]}`} />;
}
