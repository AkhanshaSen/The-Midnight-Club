"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { barConfig, type Song } from "@/lib/barConfig";
import styles from "./player.module.css";

type PlaybackUpdate = {
  isPaused?: boolean;
};

type EmbedController = {
  loadEntity: (uriOrUrl: string) => void;
  play: () => void;
  pause: () => void;
  resume: () => void;
  addListener: (event: string, callback: (event: { data?: PlaybackUpdate }) => void) => void;
  destroy: () => void;
};

type IFrameAPI = {
  createController: (
    element: HTMLElement,
    options: { url?: string; width?: number | string; height?: number | string },
    callback: (controller: EmbedController) => void,
  ) => void;
};

type SpotifyWindow = Window & {
  onSpotifyIframeApiReady?: (api: IFrameAPI) => void;
  __midnightSpotify?: IFrameAPI;
};

export type SpotifyPlayerHandle = {
  playTrack: (trackId: string) => void;
  setMuted: (muted: boolean) => void;
  togglePlayback: () => void;
};

let apiPromise: Promise<IFrameAPI> | null = null;

function trackUrl(trackId: string) {
  return `https://open.spotify.com/track/${trackId}?theme=0`;
}

function loadSpotifyApi() {
  const win = window as SpotifyWindow;
  if (win.__midnightSpotify) return Promise.resolve(win.__midnightSpotify);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    win.onSpotifyIframeApiReady = (api) => {
      win.__midnightSpotify = api;
      resolve(api);
    };

    if (document.getElementById("spotify-iframe-api")) return;

    const script = document.createElement("script");
    script.id = "spotify-iframe-api";
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      script.remove();
      apiPromise = null;
      reject(new Error("spotify-blocked"));
    };
    document.body.appendChild(script);
  });

  return apiPromise;
}

export const SpotifyPlayer = forwardRef<
  SpotifyPlayerHandle,
  {
    song: Song | null;
    needsPress: boolean;
    onPlayingChange: (playing: boolean) => void;
  }
>(function SpotifyPlayer({ song, needsPress, onPlayingChange }, ref) {
  const mountRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<EmbedController | null>(null);
  const desiredId = useRef<string | null>(null);
  const startedId = useRef<string | null>(null);
  const didStart = useRef(false);
  const booting = useRef(false);
  const mutedRef = useRef(false);
  const liveRef = useRef(false);
  const onPlayingRef = useRef(onPlayingChange);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    onPlayingRef.current = onPlayingChange;
  }, [onPlayingChange]);

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  function holdSilence(controller: EmbedController) {
    controller.pause();
    window.setTimeout(() => {
      if (mutedRef.current) controllerRef.current?.pause();
    }, 450);
  }

  useImperativeHandle(ref, () => ({
    setMuted(next: boolean) {
      mutedRef.current = next;
      const controller = controllerRef.current;
      if (!controller) return;
      if (next) controller.pause();
      else controller.resume();
    },
    togglePlayback() {
      const controller = controllerRef.current;
      if (!controller || mutedRef.current) return;
      if (liveRef.current) controller.pause();
      else controller.resume();
    },
    playTrack(trackId: string) {
      desiredId.current = trackId;
      setBlocked(false);
      const controller = controllerRef.current;
      if (controller) {
        controller.loadEntity(trackUrl(trackId));
        if (mutedRef.current) holdSilence(controller);
        else controller.play();
        return;
      }
      if (booting.current) return;
      booting.current = true;
      const finishBoot = () => {
        booting.current = false;
      };
      const timer = window.setTimeout(() => {
        if (!controllerRef.current) {
          finishBoot();
          setBlocked(true);
        }
      }, 8000);

      void loadSpotifyApi()
        .then((api) => {
          const mount = mountRef.current;
          const queued = desiredId.current;
          if (!mount || !queued || controllerRef.current) {
            window.clearTimeout(timer);
            finishBoot();
            return;
          }
          startedId.current = queued;
          api.createController(
            mount,
            {
              url: trackUrl(queued),
              width: slotRef.current?.clientWidth || 300,
              height: 152,
            },
            (controller) => {
              window.clearTimeout(timer);
              controllerRef.current = controller;
              finishBoot();
              controller.addListener("playback_update", (event) => {
                const paused = event.data?.isPaused;
                liveRef.current = paused === false;
                onPlayingRef.current(liveRef.current);
              });
              controller.addListener("ready", () => {
                const nextId = desiredId.current;
                if (!nextId) return;
                if (nextId !== startedId.current) {
                  startedId.current = nextId;
                  controller.loadEntity(trackUrl(nextId));
                }
                if (didStart.current) return;
                didStart.current = true;
                if (mutedRef.current) holdSilence(controller);
                else controller.play();
              });
            },
          );
        })
        .catch(() => {
          window.clearTimeout(timer);
          finishBoot();
          setBlocked(true);
        });
    },
  }));

  return (
    <div className={styles.player}>
      <div className={styles.embedSlot} ref={slotRef}>
        {song ? null : <p className={styles.placeholder}>The platter is empty.</p>}
        <div ref={mountRef} />
      </div>
      {song ? (
        <>
          <p className={blocked ? styles.blocked : needsPress ? styles.press : styles.copy}>
            {blocked ? barConfig.playerBlocked : barConfig.playerHint}
          </p>
          <a
            className={styles.link}
            href={`https://open.spotify.com/track/${song.spotifyTrackId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open in Spotify
          </a>
        </>
      ) : null}
    </div>
  );
});
