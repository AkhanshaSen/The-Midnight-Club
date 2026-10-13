"use client";

import styles from "./mute.module.css";

export function TheaterToggle({
  theater,
  onToggle,
}: {
  theater: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={theater}
      aria-label={theater ? "Leave theater view" : "Enter theater view"}
      onClick={onToggle}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        {theater ? (
          <path d="M6 3.5H3.5V6M10 3.5h2.5V6M6 12.5H3.5V10M10 12.5h2.5V10" />
        ) : (
          <path d="M3.5 6V3.5H6M10 3.5h2.5V6M3.5 10v2.5H6M10 12.5h2.5V10" />
        )}
      </svg>
      {theater ? "Exit" : "Theater"}
    </button>
  );
}
