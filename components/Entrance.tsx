"use client";

import styles from "./entrance.module.css";

export function Entrance({ onEnter }: { onEnter: () => void }) {
  return (
    <section className={styles.entrance}>
      <div className={styles.stack}>
        <p className={styles.kicker}>A listening bar</p>
        <h1 className={styles.title}>Midnight Club</h1>
        <button type="button" className={styles.door} onClick={onEnter} autoFocus>
          <span className={`${styles.panel} ${styles.panelTop}`} />
          <span className={`${styles.panel} ${styles.panelBottom}`} />
          <span className={styles.handle} />
          <span className={styles.leak} />
          <span className="sr-only">Enter the bar</span>
        </button>
        <p className={styles.hint}>Push to enter</p>
      </div>
    </section>
  );
}
