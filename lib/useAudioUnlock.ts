"use client";

import { useCallback, useSyncExternalStore } from "react";

const MUTE_KEY = "midnight-club-mute";

type Blip = "door" | "record" | "purr" | "clink" | "tap";

let sharedContext: AudioContext | null = null;

function getContext() {
  const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtx) return null;
  sharedContext ??= new AudioCtx();
  return sharedContext;
}

export function unlockAudio() {
  const context = getContext();
  if (context?.state === "suspended") void context.resume();
}

export function playBlip(kind: Blip, muted: boolean) {
  if (muted) return;
  const context = getContext();
  if (!context) return;
  if (context.state === "suspended") void context.resume();

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  if (kind === "purr") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(92, now);
    oscillator.frequency.exponentialRampToValueAtTime(70, now + 0.22);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
    oscillator.start(now);
    oscillator.stop(now + 0.3);
    return;
  }

  if (kind === "clink") {
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    oscillator.start(now);
    oscillator.stop(now + 0.1);
    return;
  }

  if (kind === "tap") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(240, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.04, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
    return;
  }

  if (kind === "door") {
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(146, now);
    oscillator.frequency.exponentialRampToValueAtTime(52, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    oscillator.start(now);
    oscillator.stop(now + 0.38);
    return;
  }

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(540, now);
  oscillator.frequency.exponentialRampToValueAtTime(180, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
  oscillator.start(now);
  oscillator.stop(now + 0.18);
}

const muteListeners = new Set<() => void>();

function subscribeMuted(listener: () => void) {
  muteListeners.add(listener);
  return () => muteListeners.delete(listener);
}

function readMuted() {
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function useMuted() {
  const muted = useSyncExternalStore(subscribeMuted, readMuted, () => false);
  const setMuted = useCallback((next: boolean | ((current: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(readMuted()) : next;
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    muteListeners.forEach((listener) => listener());
  }, []);
  return { muted, setMuted };
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
