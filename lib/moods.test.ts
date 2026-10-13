import { describe, expect, it } from "vitest";
import { moodFromHour, nextLamp, resolveMood } from "@/lib/moods";

describe("moodFromHour", () => {
  it("uses warm light through the afternoon", () => {
    expect(moodFromHour(5)).toBe("warm");
    expect(moodFromHour(16)).toBe("warm");
  });

  it("uses rose light in the evening", () => {
    expect(moodFromHour(17)).toBe("rose");
    expect(moodFromHour(20)).toBe("rose");
  });

  it("uses midnight the rest of the night", () => {
    expect(moodFromHour(21)).toBe("midnight");
    expect(moodFromHour(0)).toBe("midnight");
    expect(moodFromHour(4)).toBe("midnight");
  });
});

describe("resolveMood", () => {
  it("follows the clock when nothing else is chosen", () => {
    expect(resolveMood({ hour: 15, lamp: null })).toEqual({
      mood: "warm",
      lampOff: false,
      source: "time",
    });
  });

  it("lets the song override the time of day", () => {
    expect(resolveMood({ hour: 15, songMood: "rose", lamp: null })).toEqual({
      mood: "rose",
      lampOff: false,
      source: "song",
    });
  });

  it("lets a lamp choice override the song", () => {
    expect(resolveMood({ hour: 15, songMood: "rose", lamp: "midnight" })).toEqual({
      mood: "midnight",
      lampOff: false,
      source: "lamp",
    });
  });

  it("dims the current mood when the lamp is off", () => {
    expect(resolveMood({ hour: 23, songMood: "warm", lamp: "off" })).toEqual({
      mood: "warm",
      lampOff: true,
      source: "lamp",
    });
  });
});

describe("nextLamp", () => {
  it("cycles palettes and then switches the lamp off", () => {
    expect(nextLamp("warm", "warm")).toBe("rose");
    expect(nextLamp("rose", "rose")).toBe("midnight");
    expect(nextLamp("midnight", "midnight")).toBe("off");
    expect(nextLamp("off", "warm")).toBe("warm");
  });

  it("steps forward from the resolved mood on the first click", () => {
    expect(nextLamp(null, "rose")).toBe("midnight");
    expect(nextLamp(null, "midnight")).toBe("off");
  });
});
