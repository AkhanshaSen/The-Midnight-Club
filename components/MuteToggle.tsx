"use client";

import styles from "./mute.module.css";

export function MuteToggle({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute room sounds" : "Mute room sounds"}
      onClick={onToggle}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6.5h2.2L8 3.5v9L4.2 9.5H2z" />
        {muted ? (
          <path d="M10 6.5l4 4M14 6.5l-4 4" />
        ) : (
          <path d="M10.5 6.2a3 3 0 0 1 0 3.6M12.4 4.4a5.5 5.5 0 0 1 0 7.2" />
        )}
      </svg>
      {muted ? "Muted" : "Room"}
    </button>
  );
}
