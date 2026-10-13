import { barConfig } from "@/lib/barConfig";

export const dynamic = "force-static";

export async function GET() {
  const covers = Object.fromEntries(
    await Promise.all(
      barConfig.songs.map(async (song) => {
        const id = song.spotifyTrackId;
        try {
          const endpoint = new URL("https://open.spotify.com/oembed");
          endpoint.searchParams.set("url", `https://open.spotify.com/track/${id}`);
          const response = await fetch(endpoint);
          if (!response.ok) return [id, null] as const;
          const payload = (await response.json()) as { thumbnail_url?: string };
          return [id, payload.thumbnail_url ?? null] as const;
        } catch {
          return [id, null] as const;
        }
      }),
    ),
  );

  return Response.json(covers);
}
