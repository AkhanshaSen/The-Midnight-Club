import { palettes, type MoodId } from "@/lib/moods";

export type Song = {
  id: string;
  title: string;
  artist: string;
  spotifyTrackId: string;
  note?: string;
  mood?: MoodId;
};

export type MenuItem = {
  label: string;
  value: string;
};

export const barConfig = {
  name: "Midnight Club",
  tagline: "Every song I never skip",
  about: "A small room for the records that stay on until the side ends.",
  songs: [
    {
      id: "smooth-operator",
      title: "Smooth Operator",
      artist: "Sade",
      spotifyTrackId: "1UERtUFkcvn9ofD9qGl24n",
      note: "The room learned this one by heart.",
      mood: "warm",
    },
    {
      id: "pink-white",
      title: "Pink + White",
      artist: "Frank Ocean",
      spotifyTrackId: "3gATNBVu8d7oWs9WijPDjD",
      note: "For the hour when the light goes pink.",
      mood: "rose",
    },
    {
      id: "time-you-and-i",
      title: "Time (You and I)",
      artist: "Khruangbin",
      spotifyTrackId: "0bOqusuuIBSYnIyVswZJPV",
      note: "A long groove. No skipping.",
      mood: "warm",
    },
    {
      id: "movie",
      title: "Movie",
      artist: "Tom Misch",
      spotifyTrackId: "6pcED19DVN2Coh4tmmgHH6",
      note: "Soft focus, late seats.",
      mood: "rose",
    },
    {
      id: "show-me-how",
      title: "Show Me How",
      artist: "Men I Trust",
      spotifyTrackId: "75IQVo8hqI1iwVZyvkN2VT",
      note: "The quiet one I put on twice.",
      mood: "midnight",
    },
    {
      id: "apocalypse",
      title: "Apocalypse",
      artist: "Cigarettes After Sex",
      spotifyTrackId: "52k6PTgqVCBHrLndNtutrC",
      note: "Last call, still not ready to leave.",
      mood: "midnight",
    },
  ] satisfies Song[],
  menu: [
    { label: "Drinks", value: "Free" },
    { label: "Dress code", value: "None" },
    { label: "House rule", value: "No skipping" },
    { label: "On the house", value: "Ask the glass" },
  ] satisfies MenuItem[],
  moods: palettes,
  playerHint:
    "If it doesn't start, press play in Spotify. Hearing a preview? Sign in to Spotify in this browser, then press play here. Full playback depends on your Spotify account and browser.",
  playerBlocked:
    "Spotify didn’t load. The room is still open — open the song in Spotify, or try the player again.",
  privacy: "Music plays through Spotify. The embed may set its own cookies.",
  toast: "On the house",
};
