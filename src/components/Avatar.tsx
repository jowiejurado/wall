import styles from "./Avatar.module.css";

// Each name always gets the same colour, so regulars are easy to spot.
const TONES = ["blue", "coral", "mint", "sun", "grape", "sky"] as const;

function toneFor(name: string) {
  let hash = 0;
  for (const ch of name.trim().toLowerCase()) hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  return TONES[Math.abs(hash) % TONES.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = [...parts[0]][0] ?? "";
  const last = parts.length > 1 ? ([...parts[parts.length - 1]][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  return (
    <span
      className={styles.avatar}
      data-tone={name.trim() ? toneFor(name) : "empty"}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
