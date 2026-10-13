const COVER_HOST = /(^|\.)scdn\.co$|(^|\.)spotifycdn\.com$/;

export function isSpotifyCover(src: string) {
  try {
    return COVER_HOST.test(new URL(src).hostname);
  } catch {
    return false;
  }
}
