export type MoodId = "warm" | "rose" | "midnight";

export type LampChoice = MoodId | "off";

export type MoodPalette = {
  wall: string;
  glow: string;
  shadow: string;
  wood: string;
  woodDeep: string;
  brass: string;
  floor: string;
  accent: string;
};

export const palettes: Record<MoodId, MoodPalette> = {
  warm: {
    wall: "#4a2c22",
    glow: "#ffb15a",
    shadow: "#1a0e0a",
    wood: "#7a4630",
    woodDeep: "#4a2918",
    brass: "#e0b56a",
    floor: "#24160f",
    accent: "#f2d2b0",
  },
  rose: {
    wall: "#4a2340",
    glow: "#ff8fbf",
    shadow: "#1a0a14",
    wood: "#6b3454",
    woodDeep: "#3d1c30",
    brass: "#e7b0c4",
    floor: "#241018",
    accent: "#f6d0e0",
  },
  midnight: {
    wall: "#1c2a4a",
    glow: "#8eb6ff",
    shadow: "#070b16",
    wood: "#2c3c66",
    woodDeep: "#18243f",
    brass: "#a9bfe0",
    floor: "#0c1222",
    accent: "#d5e2f7",
  },
};

const LAMP_CYCLE: LampChoice[] = ["warm", "rose", "midnight", "off"];

export function moodFromHour(hour: number): MoodId {
  if (hour >= 5 && hour < 17) return "warm";
  if (hour >= 17 && hour < 21) return "rose";
  return "midnight";
}

export function resolveMood(options: {
  hour: number;
  songMood?: MoodId | null;
  lamp: LampChoice | null;
}): { mood: MoodId; lampOff: boolean; source: "lamp" | "song" | "time" } {
  const timed = moodFromHour(options.hour);
  const base = options.songMood ?? timed;

  if (options.lamp === "off") {
    return { mood: base, lampOff: true, source: "lamp" };
  }

  if (options.lamp) {
    return { mood: options.lamp, lampOff: false, source: "lamp" };
  }

  if (options.songMood) {
    return { mood: options.songMood, lampOff: false, source: "song" };
  }

  return { mood: timed, lampOff: false, source: "time" };
}

export function nextLamp(current: LampChoice | null, resolvedMood: MoodId): LampChoice {
  const start = current ?? resolvedMood;
  const index = LAMP_CYCLE.indexOf(start);
  return LAMP_CYCLE[(index + 1) % LAMP_CYCLE.length];
}
