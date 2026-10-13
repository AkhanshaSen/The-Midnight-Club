import styles from "./scene.module.css";

export function LampArt({ swing = false }: { swing?: boolean }) {
  return (
    <g className={swing ? styles.lampSwing : undefined}>
      <path d="M488 128 L420 560 L620 560 L552 128 Z" className={styles.lightCone} />
      <line x1="520" y1="0" x2="520" y2="42" className={styles.cord} />
      <ellipse cx="520" cy="18" rx="18" ry="7" className={styles.fillBrass} />
      <path d="M470 50 L570 50 L552 128 L488 128 Z" className={styles.shade} />
      <ellipse cx="520" cy="128" rx="34" ry="9" className={styles.shadeInner} />
      <circle cx="520" cy="112" r="6" className={styles.bulb} />
    </g>
  );
}

export function PendantLamp({
  label,
  onToggle,
}: {
  label: string;
  onToggle: () => void;
}) {
  return (
    <button type="button" className={`${styles.hit} ${styles.lampHit}`} aria-label={label} onClick={onToggle} />
  );
}
