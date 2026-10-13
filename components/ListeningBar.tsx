"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BarScene } from "@/components/BarScene";
import { Entrance } from "@/components/Entrance";
import { MenuNote } from "@/components/MenuNote";
import { MuteToggle } from "@/components/MuteToggle";
import { usePrefersReducedMotion } from "@/components/Particles";
import { RecordShelf } from "@/components/RecordShelf";
import { SpotifyPlayer, type SpotifyPlayerHandle } from "@/components/SpotifyPlayer";
import { TheaterToggle } from "@/components/TheaterToggle";
import { barConfig, type Song } from "@/lib/barConfig";
import { nextLamp, resolveMood, type LampChoice } from "@/lib/moods";
import { playBlip, unlockAudio, useMuted } from "@/lib/useAudioUnlock";
import styles from "./listeningBar.module.css";

const LAMP_KEY = "midnight-club-lamp";
const SLIP_MS = 520;
const SEAT_MS = 1080;

export type RecordPhase = "idle" | "slip" | "drop" | "seated";
const lampListeners = new Set<() => void>();

function isLampChoice(value: string | null): value is LampChoice {
  return value === "warm" || value === "rose" || value === "midnight" || value === "off";
}

function subscribeLamp(listener: () => void) {
  lampListeners.add(listener);
  return () => lampListeners.delete(listener);
}

function readLamp(): LampChoice | null {
  const stored = window.localStorage.getItem(LAMP_KEY);
  return isLampChoice(stored) ? stored : null;
}

function writeLamp(value: LampChoice) {
  window.localStorage.setItem(LAMP_KEY, value);
  lampListeners.forEach((listener) => listener());
}

function subscribeMinute(listener: () => void) {
  const id = window.setInterval(listener, 15_000);
  return () => window.clearInterval(id);
}

function readMinute() {
  return Math.floor(Date.now() / 60_000);
}

function subscribeNarrow(listener: () => void) {
  const query = window.matchMedia("(max-width: 760px)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

function readNarrow() {
  return window.matchMedia("(max-width: 760px)").matches;
}

export function ListeningBar() {
  const { muted, setMuted } = useMuted();
  const [entered, setEntered] = useState(false);
  const [theater, setTheater] = useState(false);
  const [songId, setSongId] = useState<string | null>(null);
  const [pulledId, setPulledId] = useState<string | null>(null);
  const [recordPhase, setRecordPhase] = useState<RecordPhase>("idle");
  const [playing, setPlaying] = useState(false);
  const [needsPress, setNeedsPress] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const lamp = useSyncExternalStore(subscribeLamp, readLamp, () => null);
  const minute = useSyncExternalStore(subscribeMinute, readMinute, () => 0);
  const narrow = useSyncExternalStore(subscribeNarrow, readNarrow, () => false);
  const playerRef = useRef<SpotifyPlayerHandle>(null);
  const noteRef = useRef<HTMLButtonElement>(null);
  const toastTimer = useRef<number | null>(null);
  const phaseTimers = useRef<number[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!entered) return;
    const controller = new AbortController();
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/covers.json`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : {}))
      .then((payload: Record<string, string | null>) => setCovers(payload))
      .catch(() => {});
    return () => controller.abort();
  }, [entered]);

  useEffect(() => {
    return () => {
      phaseTimers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    playerRef.current?.setMuted(muted);
  }, [muted]);

  useEffect(() => {
    function onFullscreen() {
      setTheater(Boolean(document.fullscreenElement));
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setTheater(false);
    }
    document.addEventListener("fullscreenchange", onFullscreen);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  async function toggleTheater() {
    const root = document.documentElement;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setTheater(false);
      return;
    }
    if (!theater && root.requestFullscreen) {
      try {
        await root.requestFullscreen();
        setTheater(true);
        return;
      } catch {
        setTheater(true);
        return;
      }
    }
    setTheater((current) => !current);
  }

  function toggleDeck() {
    if (muted) return;
    playerRef.current?.togglePlayback();
  }

  useEffect(() => {
    if (!songId || playing) return;
    const timer = window.setTimeout(() => setNeedsPress(true), 2200);
    return () => window.clearTimeout(timer);
  }, [songId, playing]);

  const song = barConfig.songs.find((item) => item.id === songId) ?? null;
  const now = entered ? new Date(minute * 60_000) : null;
  const hour = now?.getHours() ?? 23;
  const resolved = resolveMood({
    hour,
    songMood: song?.mood,
    lamp,
  });

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  function enter() {
    unlockAudio();
    playBlip("door", muted);
    setEntered(true);
  }

  function clearPhaseTimers() {
    phaseTimers.current.forEach((id) => window.clearTimeout(id));
    phaseTimers.current = [];
  }

  function selectSong(id: string) {
    const next = barConfig.songs.find((item) => item.id === id);
    if (!next) return;
    unlockAudio();
    playBlip("record", muted);
    setSongId(id);
    setPlaying(false);
    setNeedsPress(false);
    clearPhaseTimers();
    if (reducedMotion) {
      setPulledId(null);
      setRecordPhase("seated");
    } else {
      setPulledId(id);
      setRecordPhase("slip");
      phaseTimers.current.push(window.setTimeout(() => setRecordPhase("drop"), SLIP_MS));
      phaseTimers.current.push(
        window.setTimeout(() => {
          setRecordPhase("seated");
          setPulledId((current) => (current === id ? null : current));
        }, SEAT_MS),
      );
    }
    playerRef.current?.playTrack(next.spotifyTrackId);
  }

  function cycleLamp() {
    writeLamp(nextLamp(lamp, resolveMood({ hour, songMood: song?.mood, lamp }).mood));
  }

  function pour() {
    setToast(barConfig.toast);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  const timeLabel = now
    ? now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "—";
  const status = `${now ? now.toLocaleDateString([], { day: "numeric", month: "short" }) : "Tonight"} · ${
    playing && song ? song.title : "open late"
  }`;

  return (
    <div
      className={styles.page}
      data-mood={entered ? resolved.mood : undefined}
      data-lamp={entered && resolved.lampOff ? "off" : undefined}
      data-theater={entered && theater ? "true" : undefined}
    >
      <div className={styles.controls}>
        {entered ? <TheaterToggle theater={theater} onToggle={toggleTheater} /> : null}
        <MuteToggle
          muted={muted}
          onToggle={() => {
            unlockAudio();
            setMuted((current) => !current);
          }}
        />
      </div>
      {entered ? (
        <main className={styles.main}>
          <div className={styles.stageWrap}>
            <BarScene
              playing={playing}
              song={song}
              covers={covers}
              selectedId={songId}
              pulledId={pulledId}
              hint={hintFor(song, playing, needsPress)}
              timeLabel={timeLabel}
              lampLabel={
                resolved.lampOff
                  ? "Lamp is off. Turn the light on."
                  : `Lamp is ${resolved.mood}. Change the light.`
              }
              toast={toast}
              noteRef={noteRef}
              onSelect={selectSong}
              onLamp={cycleLamp}
              onOpenMenu={() => setMenuOpen(true)}
              onPour={pour}
              showShelf={!narrow}
              recordPhase={recordPhase}
              theater={theater}
              muted={muted}
              onToggleDeck={toggleDeck}
            />
          </div>
          {narrow ? (
            <RecordShelf
              variant="carousel"
              songs={barConfig.songs}
              covers={covers}
              selectedId={songId}
              pulledId={pulledId}
              onSelect={selectSong}
            />
          ) : null}
          <aside className={styles.dock} aria-label="Now playing">
            <p className={styles.status}>{status}</p>
            <SpotifyPlayer
              ref={playerRef}
              song={song}
              needsPress={needsPress}
              onPlayingChange={(next) => {
                setPlaying(next);
                if (next) setNeedsPress(false);
              }}
            />
            <p className={styles.privacy}>{barConfig.privacy}</p>
          </aside>
        </main>
      ) : (
        <Entrance onEnter={enter} />
      )}
      {menuOpen ? <MenuNote openerRef={noteRef} onClose={closeMenu} /> : null}
    </div>
  );
}

function hintFor(song: Song | null, playing: boolean, needsPress: boolean) {
  if (!song) return "Pick a record";
  if (!playing || needsPress) return "Press play in Spotify";
  return song.note ?? `${song.title} · ${song.artist}`;
}
