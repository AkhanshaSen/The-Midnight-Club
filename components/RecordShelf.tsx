"use client";

import Image from "next/image";
import { useRef, type KeyboardEvent } from "react";
import type { Song } from "@/lib/barConfig";
import { isSpotifyCover } from "@/lib/covers";
import styles from "./shelf.module.css";

const TILTS = ["-8deg", "-4deg", "-1deg", "2deg", "5deg", "8deg"];

export function RecordShelf({
  variant,
  songs,
  covers,
  selectedId,
  pulledId,
  onSelect,
}: {
  variant: "stage" | "carousel";
  songs: Song[];
  covers: Record<string, string | null>;
  selectedId: string | null;
  pulledId: string | null;
  onSelect: (id: string) => void;
}) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const current = buttons.current.findIndex((button) => button === document.activeElement);
    const start = current === -1 ? 0 : current;
    const next =
      event.key === "ArrowRight"
        ? Math.min(songs.length - 1, start + (current === -1 ? 0 : 1))
        : Math.max(0, start - 1);
    buttons.current[next]?.focus();
  }

  const list = (
    <ul
      className={variant === "stage" ? styles.sceneShelf : styles.carousel}
      aria-label="Records"
      onKeyDown={onKeyDown}
    >
      {songs.map((song, index) => {
        const cover = covers[song.spotifyTrackId];
        const button = (
          <button
            type="button"
            ref={(node) => {
              buttons.current[index] = node;
            }}
            className={styles.cover}
            style={{ ["--tilt" as string]: TILTS[index] ?? "0deg" }}
            data-selected={selectedId === song.id}
            data-pulling={pulledId === song.id}
            aria-pressed={selectedId === song.id}
            aria-label={`Play ${song.title} by ${song.artist}`}
            draggable={false}
            onDragStart={(event) => event.preventDefault()}
            onClick={() => onSelect(song.id)}
          >
            {cover && isSpotifyCover(cover) ? (
              <Image src={cover} alt="" fill sizes="120px" unoptimized draggable={false} className={styles.art} />
            ) : (
              <span className={styles.fallback}>{song.title}</span>
            )}
          </button>
        );

        if (variant === "carousel") {
          return (
            <li key={song.id} className={styles.carouselItem}>
              {button}
              <span className={styles.meta}>
                <span className={styles.title}>{song.title}</span>
                <span className={styles.artist}>{song.artist}</span>
              </span>
            </li>
          );
        }

        return <li key={song.id}>{button}</li>;
      })}
    </ul>
  );

  if (variant === "carousel") return list;

  return (
    <div className={styles.sceneShelfWrap}>
      {selectedId ? null : <p className={styles.pick}>Pick a record</p>}
      {list}
    </div>
  );
}
