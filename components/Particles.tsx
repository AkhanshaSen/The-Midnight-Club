"use client";

import { useSyncExternalStore } from "react";
import styles from "./scene.module.css";

const BITS = [
  { x: "14%", delay: "0s", dur: "6.4s", char: "♪" },
  { x: "24%", delay: "1.1s", dur: "7.6s", char: "✦" },
  { x: "36%", delay: "0.4s", dur: "8s", char: "♫" },
  { x: "47%", delay: "2.1s", dur: "6.8s", char: "♪" },
  { x: "58%", delay: "0.7s", dur: "7.4s", char: "✦" },
  { x: "69%", delay: "1.8s", dur: "8.2s", char: "♫" },
  { x: "80%", delay: "0.2s", dur: "7s", char: "♪" },
  { x: "31%", delay: "2.6s", dur: "9s", char: "✦" },
];

function subscribeMotion(listener: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function readMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, readMotion, () => false);
}

export function Particles({ playing }: { playing: boolean }) {
  const reduced = usePrefersReducedMotion();
  if (!playing || reduced) return null;

  return (
    <div className={styles.particles} aria-hidden="true">
      {BITS.map((bit) => (
        <span
          key={`${bit.x}-${bit.delay}`}
          style={{
            ["--x" as string]: bit.x,
            ["--delay" as string]: bit.delay,
            ["--dur" as string]: bit.dur,
          }}
        >
          {bit.char}
        </span>
      ))}
    </div>
  );
}
