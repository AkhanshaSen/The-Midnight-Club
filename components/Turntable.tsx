import styles from "./scene.module.css";

export function Turntable({
  playing,
  seated,
  initial,
}: {
  playing: boolean;
  seated: boolean;
  initial: string;
}) {
  const live = playing && seated;

  return (
    <g>
      <ellipse cx="724" cy="578" rx="108" ry="16" className={styles.platterShadow} filter="url(#softBlur)" />
      <ellipse cx="624" cy="604" rx="14" ry="5" className={styles.fillShadow} />
      <ellipse cx="824" cy="604" rx="14" ry="5" className={styles.fillShadow} />
      <rect x="600" y="536" width="250" height="64" rx="12" className={styles.fillWoodDeep} />
      <rect x="608" y="536" width="234" height="8" rx="4" className={styles.plinthLip} />
      <rect x="612" y="548" width="226" height="14" rx="5" className={styles.fillWood} />
      <circle cx="656" cy="578" r="5" className={styles.fillBrass} />
      <circle cx="792" cy="578" r="5" className={styles.fillBrass} />
      <ellipse cx="724" cy="552" rx="96" ry="36" fill="url(#platterMetal)" />
      <ellipse cx="724" cy="548" rx="70" ry="18" className={styles.platterSheen} />
      <g className={seated ? styles.vinylOn : styles.vinylOff}>
        <g transform="translate(724 552) scale(1 0.37)">
          <g className={live ? styles.spin : undefined}>
            <circle r="78" fill="url(#vinylGrooves)" />
            <circle r="70" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
            <circle r="58" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.7" />
            <circle r="46" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
            <circle r="34" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
            <circle r="24" className={styles.label} />
            <circle r="24" fill="url(#labelSheen)" />
            <ellipse cx="-20" cy="-28" rx="24" ry="13" className={styles.vinylSheen} />
          </g>
        </g>
      </g>
      {seated ? (
        <text x="724" y="556" textAnchor="middle" className={styles.spindleText}>
          {initial}
        </text>
      ) : null}
      <ellipse cx="708" cy="544" rx="22" ry="6" className={styles.platterGloss} />
      <ellipse cx="724" cy="552" rx="3.5" ry="1.6" fill="#f3eadc" />
      <g className={`${styles.arm} ${live ? styles.armPlay : styles.armRest}`}>
        <circle cx="794" cy="536" r="6.5" className={styles.fillBrass} />
        <circle cx="794" cy="536" r="3" className={styles.fillWoodDeep} />
        <circle cx="808" cy="524" r="7" className={styles.fillBrass} />
        <path d="M808 524 C834 508 858 496 878 492" className={styles.armStroke} />
        <circle cx="880" cy="491" r="5" className={styles.fillAccent} />
      </g>
    </g>
  );
}
