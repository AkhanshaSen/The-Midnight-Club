"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";
import type { RecordPhase } from "@/components/ListeningBar";
import type { Song } from "@/lib/barConfig";
import { isSpotifyCover } from "@/lib/covers";
import { barConfig } from "@/lib/barConfig";
import { playBlip } from "@/lib/useAudioUnlock";
import { LampArt, PendantLamp } from "@/components/PendantLamp";
import { Particles, usePrefersReducedMotion } from "@/components/Particles";
import { RecordShelf } from "@/components/RecordShelf";
import { Turntable } from "@/components/Turntable";
import styles from "./scene.module.css";

const UPPER_BOTTLES = [
  { x: 86, h: 86, color: "#6e8f78" },
  { x: 116, h: 108, color: "#c47b3a" },
  { x: 148, h: 74, color: "#d8c6a4" },
  { x: 178, h: 124, color: "#2f5e4a" },
  { x: 210, h: 90, color: "#8c3d3d" },
  { x: 242, h: 68, color: "#c9a36a" },
  { x: 272, h: 102, color: "#315c74" },
  { x: 304, h: 80, color: "#c47b3a" },
];

const STOOLS = [150, 390, 720, 1040, 1280];
const STAGE_WIDTH = 1440;
const GLASS_MIN = -50;
const GLASS_MAX = 1170;

const LOWER_BOTTLES = [
  { x: 92, h: 62, color: "#d8c6a4" },
  { x: 124, h: 70, color: "#2f5e4a" },
  { x: 156, h: 54, color: "#8c3d3d" },
  { x: 250, h: 66, color: "#315c74" },
  { x: 282, h: 58, color: "#c9a36a" },
  { x: 314, h: 72, color: "#6e8f78" },
];

export function BarScene({
  playing,
  song,
  covers,
  selectedId,
  pulledId,
  hint,
  timeLabel,
  lampLabel,
  toast,
  noteRef,
  onSelect,
  onLamp,
  onOpenMenu,
  onPour,
  showShelf = true,
  recordPhase,
  theater = false,
  muted,
  onToggleDeck,
}: {
  playing: boolean;
  song: Song | null;
  covers: Record<string, string | null>;
  selectedId: string | null;
  pulledId: string | null;
  hint: string;
  timeLabel: string;
  lampLabel: string;
  toast: string | null;
  noteRef: RefObject<HTMLButtonElement | null>;
  onSelect: (id: string) => void;
  onLamp: () => void;
  onOpenMenu: () => void;
  onPour: () => void;
  showShelf?: boolean;
  recordPhase: RecordPhase;
  theater?: boolean;
  muted: boolean;
  onToggleDeck: () => void;
}) {
  const cover = song ? covers[song.spotifyTrackId] : null;
  const stageRef = useRef<HTMLDivElement>(null);
  const [glassShift, setGlassShift] = useState(0);
  const dragRef = useRef<{ id: number; x: number; origin: number; moved: boolean } | null>(null);
  const pourTimers = useRef<number[]>([]);
  const [pouring, setPouring] = useState(false);
  const [poured, setPoured] = useState(false);
  const [bottlePose, setBottlePose] = useState<"rest" | "pour" | "settle">("rest");
  const [catStir, setCatStir] = useState(false);
  const [rain, setRain] = useState(false);
  const [clinkRow, setClinkRow] = useState<"upper" | "lower" | null>(null);
  const [swinging, setSwinging] = useState(false);
  const [spinningStool, setSpinningStool] = useState<number | null>(null);
  const [hintNudge, setHintNudge] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    return () => {
      pourTimers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function clearPourTimers() {
    pourTimers.current.forEach((id) => window.clearTimeout(id));
    pourTimers.current = [];
  }

  function beginPour() {
    if (pouring) return;
    onPour();
    if (reducedMotion) {
      setPoured(true);
      setBottlePose("rest");
      return;
    }
    clearPourTimers();
    setPouring(true);
    setBottlePose("pour");
    pourTimers.current.push(
      window.setTimeout(() => {
        setPouring(false);
        setPoured(true);
        setBottlePose("settle");
      }, 2100),
    );
    pourTimers.current.push(window.setTimeout(() => setBottlePose("rest"), 2800));
  }

  function stirCat() {
    if (catStir) return;
    playBlip("purr", muted);
    setCatStir(true);
    window.setTimeout(() => setCatStir(false), 1400);
  }

  function clink(row: "upper" | "lower") {
    if (clinkRow) return;
    playBlip("clink", muted);
    setClinkRow(row);
    window.setTimeout(() => setClinkRow(null), 900);
  }

  function toggleRain() {
    playBlip("tap", muted);
    setRain((current) => !current);
  }

  function toggleLamp() {
    onLamp();
    setSwinging(true);
    window.setTimeout(() => setSwinging(false), 1600);
  }

  function spinStool(index: number) {
    if (spinningStool !== null) return;
    playBlip("tap", muted);
    setSpinningStool(index);
    window.setTimeout(() => setSpinningStool(null), 800);
  }

  function tapDeck() {
    if (!song) {
      setHintNudge(true);
      window.setTimeout(() => setHintNudge(false), 700);
      return;
    }
    onToggleDeck();
  }

  function onGlassPointerDown(event: PointerEvent<HTMLButtonElement>) {
    dragRef.current = { id: event.pointerId, x: event.clientX, origin: glassShift, moved: false };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // A pointer that is already gone still slides from the events that reach this button.
    }
  }

  function onGlassPointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || drag.id !== event.pointerId || !stage) return;
    const dx = ((event.clientX - drag.x) / stage.getBoundingClientRect().width) * STAGE_WIDTH;
    if (Math.abs(event.clientX - drag.x) > 5) drag.moved = true;
    setGlassShift(Math.min(GLASS_MAX, Math.max(GLASS_MIN, drag.origin + dx)));
  }

  function onGlassPointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    if (!drag.moved) beginPour();
  }

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      data-theater={theater ? "true" : undefined}
      style={{ ["--glass-shift" as string]: `${(glassShift / STAGE_WIDTH) * 100}%` }}
      onDragStart={(event) => event.preventDefault()}
    >
      <h1 className="sr-only">{barConfig.name}</h1>
      <svg className={styles.scene} viewBox="0 0 1440 810" aria-hidden="true">
        <defs>
          <radialGradient id="glowPoolGrad" cx="50%" cy="48%" r="50%">
            <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.7" />
            <stop offset="55%" stopColor="var(--glow)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--glow)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vinylGrooves" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#4a3424" />
            <stop offset="15%" stopColor="#3a2a1c" />
            <stop offset="17%" stopColor="#121214" />
            <stop offset="28%" stopColor="#1c1c1e" />
            <stop offset="31%" stopColor="#0c0c0e" />
            <stop offset="44%" stopColor="#1a1a1c" />
            <stop offset="47%" stopColor="#09090b" />
            <stop offset="60%" stopColor="#18181a" />
            <stop offset="63%" stopColor="#0a0a0c" />
            <stop offset="76%" stopColor="#161618" />
            <stop offset="79%" stopColor="#08080a" />
            <stop offset="100%" stopColor="#101012" />
          </radialGradient>
          <radialGradient id="labelSheen" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.25" />
          </radialGradient>
          <linearGradient id="shadeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
            <stop offset="18%" stopColor="var(--brass)" />
            <stop offset="100%" stopColor="var(--wood-deep)" />
          </linearGradient>
          <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050814" />
            <stop offset="100%" stopColor="#243456" />
          </linearGradient>
          <radialGradient id="moonGlow" cx="28%" cy="24%" r="42%">
            <stop offset="0%" stopColor="#f4e7d0" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#f4e7d0" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#f4e7d0" stopOpacity="0" />
          </radialGradient>
          <clipPath id="windowClip">
            <rect x="714" y="86" width="182" height="240" />
          </clipPath>
          <linearGradient id="platterMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3a40" />
            <stop offset="45%" stopColor="#1a1a1e" />
            <stop offset="100%" stopColor="#0e0e10" />
          </linearGradient>
          <filter id="softBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id="contact" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        <rect width="1440" height="810" className={styles.fillShadow} />
        <rect width="1440" height="620" className={styles.fillWall} />
        <rect y="690" width="1440" height="120" className={styles.fillFloor} />
        {Array.from({ length: 8 }, (_, index) => (
          <line
            key={index}
            x1="0"
            x2="1440"
            y1={700 + index * 14}
            y2={700 + index * 14}
            stroke="#000"
            strokeOpacity="0.18"
          />
        ))}
        <rect y="600" width="1440" height="18" className={styles.fillWoodDeep} />

        <g opacity="0.55">
          <rect x="70" y="110" width="300" height="300" rx="6" className={styles.fillShadow} />
        </g>
        <Shelf x={64} y={236} width={320} />
        {UPPER_BOTTLES.map((bottle, index) => (
          <Bottle
            key={`u-${bottle.x}`}
            x={bottle.x}
            y={236 - bottle.h}
            h={bottle.h}
            color={bottle.color}
            wobble={clinkRow === "upper"}
            delay={index * 0.05}
          />
        ))}
        <Shelf x={64} y={400} width={320} />
        {LOWER_BOTTLES.map((bottle, index) => (
          <Bottle
            key={`l-${bottle.x}`}
            x={bottle.x}
            y={400 - bottle.h}
            h={bottle.h}
            color={bottle.color}
            wobble={clinkRow === "lower"}
            delay={index * 0.05}
          />
        ))}
        <Tumbler x={188} y={368} />
        <Tumbler x={214} y={372} />

        <g>
          <rect x="700" y="72" width="210" height="268" rx="6" className={styles.fillWoodDeep} />
          <rect x="714" y="86" width="182" height="240" fill="url(#nightSky)" />
          <circle cx="760" cy="140" r="16" fill="url(#moonGlow)" />
          <circle cx="790" cy="118" r="1.4" fill="#f4e7d0" opacity="0.8" />
          <circle cx="840" cy="132" r="1.1" fill="#f4e7d0" opacity="0.7" />
          <circle cx="868" cy="108" r="1.3" fill="#f4e7d0" opacity="0.85" />
          <rect x="724" y="210" width="26" height="116" fill="#10192c" />
          <rect x="756" y="176" width="34" height="150" fill="#152238" />
          <rect x="796" y="198" width="22" height="128" fill="#10192c" />
          <rect x="824" y="150" width="40" height="176" fill="#182844" />
          <rect x="714" y="186" width="182" height="140" className={styles.windowGlow} />
          <rect x="762" y="188" width="6" height="8" className={rain ? styles.flicker : styles.windowLight} />
          <rect x="804" y="214" width="6" height="8" className={rain ? styles.flicker : styles.windowLight} />
          <rect x="836" y="168" width="6" height="8" className={rain ? styles.flicker : styles.windowLight} />
          <rect x="842" y="196" width="6" height="8" className={rain ? styles.flicker : styles.windowLight} />
          {rain ? (
            <g clipPath="url(#windowClip)" className={styles.rain}>
              {[
                [728, 100],
                [752, 150],
                [786, 96],
                [812, 170],
                [844, 120],
                [868, 188],
                [738, 210],
                [804, 230],
              ].map(([x, y]) => (
                <line key={`${x}-${y}`} x1={x} y1={y} x2={x - 4} y2={y + 16} />
              ))}
            </g>
          ) : null}
        </g>

        <ellipse cx="640" cy="470" rx="480" ry="270" fill="url(#glowPoolGrad)" />
        <LampArt swing={swinging} />

        <Shelf x={930} y={400} width={450} />

        <rect x="40" y="586" width="1360" height="22" className={styles.fillWood} />
        <rect x="40" y="586" width="1360" height="4" className={styles.counterSheen} />
        {[0, 1, 2, 3, 4].map((index) => (
          <line
            key={index}
            x1={90 + index * 260}
            y1={596}
            x2={230 + index * 250}
            y2={602}
            stroke="#000"
            strokeOpacity="0.14"
          />
        ))}
        <rect x="40" y="682" width="1360" height="12" fill="#000" opacity="0.16" />
        <rect x="40" y="608" width="1360" height="82" className={styles.fillWoodDeep} />
        <rect x="78" y="662" width="1284" height="7" rx="3" className={styles.fillBrass} />

        <g transform="rotate(-8 310 548)">
          <rect x="268" y="516" width="84" height="68" rx="3" className={styles.notePaper} />
          <text x="280" y="544" className={styles.noteInk}>
            On the
          </text>
          <text x="280" y="564" className={styles.noteInk}>
            menu
          </text>
        </g>

        <Turntable
          playing={playing}
          seated={recordPhase === "seated"}
          initial={song ? song.title.slice(0, 1) : ""}
        />
        <g transform={`translate(${glassShift} 0)`} filter="url(#contact)">
          <path
            d="M176 392 C174 450 178 496 180 528"
            className={pouring ? styles.streamOn : styles.stream}
          />
          <Coupe pouring={pouring} poured={poured} />
          <WineBottle pose={bottlePose} />
        </g>
        <Cat stirring={catStir} />

        {STOOLS.map((x, index) => (
          <Stool key={x} x={x} spinning={spinningStool === index} />
        ))}
      </svg>

      <div className={styles.vignette} aria-hidden="true" />
      <div className={styles.bloom} aria-hidden="true" />
      <div className={styles.reflection} aria-hidden="true" />

      <div className={styles.dust} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {song ? (
        <div key={`${song.id}-sleeve`} className={cover && isSpotifyCover(cover) ? styles.sleeve : styles.sleeveFallback}>
          {cover && isSpotifyCover(cover) ? (
            <Image src={cover} alt="" fill sizes="120px" unoptimized draggable={false} />
          ) : null}
        </div>
      ) : null}
      {song && (recordPhase === "slip" || recordPhase === "drop") ? (
        <div key={`${song.id}-record`} className={styles.travelRecord} data-phase={recordPhase} aria-hidden="true">
          <span>{song.title.slice(0, 1)}</span>
        </div>
      ) : null}

      <PendantLamp label={lampLabel} onToggle={toggleLamp} />
      <button type="button" className={`${styles.hit} ${styles.catHit}`} aria-label="Stir the sleeping cat" onClick={stirCat} />
      <button
        type="button"
        className={`${styles.hit} ${styles.deckHit}`}
        aria-label={song ? "Pause or resume the record" : "The platter is empty"}
        onClick={tapDeck}
      />
      <button type="button" className={`${styles.hit} ${styles.upperBottles}`} aria-label="Clink the top shelf bottles" onClick={() => clink("upper")} />
      <button type="button" className={`${styles.hit} ${styles.lowerBottles}`} aria-label="Clink the lower shelf bottles" onClick={() => clink("lower")} />
      <button type="button" className={`${styles.hit} ${styles.windowHit}`} aria-label={rain ? "Stop the rain" : "Start the rain"} onClick={toggleRain} />
      {STOOLS.map((x, index) => (
        <button
          key={x}
          type="button"
          className={`${styles.hit} ${styles.stoolHit}`}
          style={{ left: `${((x - 40) / STAGE_WIDTH) * 100}%` }}
          aria-label="Spin the stool"
          onClick={() => spinStool(index)}
        />
      ))}
      <button
        type="button"
        className={`${styles.hit} ${styles.glassHit}`}
        aria-label="Drag the glass along the counter, or tap to pour a drink"
        onPointerDown={onGlassPointerDown}
        onPointerMove={onGlassPointerMove}
        onPointerUp={onGlassPointerUp}
      />
      <button
        type="button"
        ref={noteRef}
        className={`${styles.hit} ${styles.noteHit}`}
        onClick={onOpenMenu}
        aria-haspopup="dialog"
        aria-label="On the menu"
      />

      {showShelf ? (
        <RecordShelf
          variant="stage"
          songs={barConfig.songs}
          covers={covers}
          selectedId={selectedId}
          pulledId={pulledId}
          onSelect={onSelect}
        />
      ) : null}
      <Particles playing={playing} />

      <p className={styles.time}>
        <span className={styles.timeValue}>{timeLabel}</span>
        <span className={styles.club}>{barConfig.name}</span>
      </p>
      <p className={hintNudge ? `${styles.hint} ${styles.hintNudge}` : styles.hint} aria-live="polite">
        {hint}
      </p>
      {toast ? (
        <p className={styles.toast} role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}

function Shelf({ x, y, width }: { x: number; y: number; width: number }) {
  return (
    <g>
      <ellipse cx={x + width / 2} cy={y + 6} rx={width / 2 - 8} ry="7" fill="#000" opacity="0.22" />
      <rect x={x} y={y} width={width} height={14} rx="2" className={styles.fillWood} />
      <rect x={x} y={y + 14} width={width} height={8} className={styles.fillWoodDeep} />
      <rect x={x + 18} y={y + 14} width="8" height="26" className={styles.fillBrass} />
      <rect x={x + width - 26} y={y + 14} width="8" height="26" className={styles.fillBrass} />
    </g>
  );
}

function Bottle({
  x,
  y,
  h,
  color,
  wobble,
  delay,
}: {
  x: number;
  y: number;
  h: number;
  color: string;
  wobble: boolean;
  delay: number;
}) {
  const neck = Math.max(18, h * 0.28);
  const id = `bottle-${x}-${y}`;
  return (
    <g className={wobble ? styles.wobble : undefined} style={{ animationDelay: `${delay}s` }}>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
        <stop offset="22%" stopColor={color} />
        <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
      </linearGradient>
      <rect x={x + 4} y={y - 4} width="10" height="6" rx="1" fill="#1a120c" opacity="0.55" />
      <rect x={x + 5} y={y} width="8" height={neck} rx="2" fill={`url(#${id})`} />
      <rect x={x} y={y + neck - 4} width="18" height={h - neck + 4} rx="4" fill={`url(#${id})`} />
      <rect x={x + 3} y={y + neck + 2} width="3" height={(h - neck) * 0.5} rx="1.5" fill="#fff" opacity="0.28" />
    </g>
  );
}

function Tumbler({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y} h18 l-3 28 h-12 z`} fill="rgba(215,228,234,0.45)" stroke="rgba(243,234,220,0.45)" />
      <path d={`M${x + 3} ${y + 14} h12 l-1 12 h-10 z`} fill="var(--glow)" opacity="0.75" />
    </g>
  );
}

function Coupe({ pouring, poured }: { pouring: boolean; poured: boolean }) {
  const liquidState = pouring ? "pouring" : poured ? "poured" : "empty";
  return (
    <g>
      <path d="M146 500 L214 500 L186 546 L174 546 Z" className={styles.glassBowl} />
      <path
        d="M158 508 L202 508 L184 534 L176 534 Z"
        className={styles.liquid}
        data-state={liquidState}
      />
      <path d="M160 506 L172 506 L166 524 Z" className={styles.glint} />
      <circle cx="168" cy="516" r="4" fill="#9d2b3a" />
      <rect x="178" y="546" width="4" height="28" fill="rgba(243,234,220,0.75)" />
      <ellipse cx="180" cy="578" rx="24" ry="6" fill="rgba(243,234,220,0.8)" />
    </g>
  );
}

function WineBottle({ pose }: { pose: "rest" | "pour" | "settle" }) {
  const poseClass = pose === "pour" ? styles.bottlePour : pose === "settle" ? styles.bottleSettle : styles.bottleRest;
  return (
    <g className={poseClass}>
      <path
        d="M100 500 C96 506 94 518 94 530 L94 562 Q94 576 108 576 Q122 576 122 562 L122 530 C122 518 120 506 116 500 Z"
        className={styles.bottleGlass}
      />
      <path
        d="M102 520 C100 526 99 536 99 546 L99 560 Q99 570 108 570 Q117 570 117 560 L117 546 C117 536 116 526 114 520 Z"
        className={styles.bottleWine}
      />
      <rect x="104" y="468" width="8" height="34" rx="2" className={styles.bottleGlass} />
      <rect x="105.5" y="476" width="2.5" height="18" rx="1" fill="#fff" opacity="0.35" />
      <rect x="103" y="456" width="10" height="14" rx="1.5" className={styles.cork} />
      <rect x="102" y="466" width="12" height="5" className={styles.foil} />
      <rect x="99" y="530" width="18" height="16" rx="1" className={styles.bottleLabel} />
    </g>
  );
}

function Cat({ stirring }: { stirring: boolean }) {
  return (
    <g transform="translate(1168 586)">
      <g className={stirring ? `${styles.cat} ${styles.catStir}` : styles.cat}>
        <path d="M46 -6 C72 -22 80 -2 62 4 C48 8 58 0 46 6" className={styles.catTail} />
        <ellipse cx="8" cy="-18" rx="54" ry="26" className={styles.catBody} />
        <path d="M-16 -22 Q-4 -30 10 -20" className={styles.catStripe} />
        <path d="M-6 -12 Q6 -20 20 -10" className={styles.catStripe} />
        <ellipse cx="-32" cy="-30" rx="24" ry="18" className={styles.catHead} />
        <path d="M-48 -38 L-42 -56 L-32 -38 Z" className={styles.catEar} />
        <path d="M-30 -40 L-22 -56 L-14 -36 Z" className={styles.catEar} />
        <path d="M-40 -32 Q-36 -30 -32 -32" className={styles.catEye} />
        <path d="M-28 -31 Q-23 -29 -18 -31" className={styles.catEye} />
        <circle cx="-30" cy="-24" r="1.6" className={styles.catNose} />
        <ellipse cx="-6" cy="-4" rx="9" ry="5" className={styles.catPaw} />
        <ellipse cx="10" cy="-2" rx="9" ry="5" className={styles.catPaw} />
        <ellipse cx="-4" cy="-3" rx="2" ry="1.2" fill="#fff" opacity="0.35" />
      </g>
      {stirring ? (
        <text x="20" y="-62" className={styles.heart}>
          ♥
        </text>
      ) : null}
    </g>
  );
}

function Stool({ x, spinning }: { x: number; spinning: boolean }) {
  return (
    <g className={spinning ? styles.stoolSpin : undefined}>
      <line x1={x - 24} y1="728" x2={x - 36} y2="806" stroke="var(--brass)" strokeWidth="4" />
      <line x1={x + 24} y1="728" x2={x + 36} y2="806" stroke="var(--brass)" strokeWidth="4" />
      <line x1={x - 28} y1="768" x2={x + 28} y2="768" stroke="var(--brass)" strokeWidth="4" />
      <line x1={x - 22} y1="766" x2={x + 22} y2="766" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.5" />
      <ellipse cx={x} cy="730" rx="40" ry="15" className={styles.fillWoodDeep} />
      <ellipse cx={x} cy="722" rx="32" ry="10" className={styles.fillWood} />
      <ellipse cx={x - 8} cy="718" rx="12" ry="4" fill="#fff" opacity="0.14" />
    </g>
  );
}
