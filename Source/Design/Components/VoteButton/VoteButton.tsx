import styles from './VoteButton.module.css';

export interface VoteButtonProps {
  voted: boolean;
  onVote: () => void;
}

export function VoteButton({ voted, onVote }: VoteButtonProps) {
  return (
    <button class={`${styles.Root} ${voted ? styles.Voted : ''}`} onClick={onVote}>
      {voted ? '✓' : '+'}
    </button>
  );
}
