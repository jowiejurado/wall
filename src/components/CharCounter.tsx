import styles from "./Composer.module.css";

const R = 9;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** A ring that fills as you type, plus the characters left. Turns amber near the end, red when over. */
export function CharCounter({ used, max }: { used: number; max: number }) {
  const remaining = max - used;
  const progress = Math.min(used / max, 1);
  const state = remaining < 0 ? "over" : remaining <= 20 ? "low" : "ok";

  return (
    <span className={styles.counter} data-state={state}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r={R} className={styles.counterTrack} />
        <circle
          cx="12"
          cy="12"
          r={R}
          className={styles.counterFill}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>
      <span aria-live="polite" aria-atomic="true">
        <span className={styles.srOnly}>Characters left: </span>
        {remaining}
      </span>
    </span>
  );
}
