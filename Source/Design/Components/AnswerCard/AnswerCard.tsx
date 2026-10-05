import styles from "./AnswerCard.module.css";

export interface AnswerCardProps {
  text: string;
  playerName: string;
  isRejected?: boolean;
  onReject?: () => void;
  showReject?: boolean;
}

export function AnswerCard({
  text,
  playerName,
  isRejected = false,
  onReject,
  showReject = false,
}: AnswerCardProps) {
  return (
    <div class={`${styles.Root} ${isRejected ? styles.Rejected : ""}`}>
      <span class={styles.Player}>{playerName}</span>
      <span class={styles.Text}>{text}</span>
      {showReject && onReject && (
        <button class={styles.RejectButton} onClick={onReject}>
          ✕
        </button>
      )}
    </div>
  );
}
