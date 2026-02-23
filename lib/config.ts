// ─── Single source of truth for the app base URL ────────────────────────────
// Change NEXT_PUBLIC_APP_URL in .env when going to production.
// Everything else is derived from it automatically.

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Spotify
export const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? "";
export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? "";
export const SPOTIFY_REDIRECT_URI = `${APP_URL}/api/auth/callback/spotify`;
export const SPOTIFY_SCOPES = [
  "user-read-private",
  "user-read-email",
  "user-top-read",
  "playlist-modify-public",
  "playlist-modify-private",
].join(" ");

// GitHub AI
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
export const GITHUB_MODELS_ENDPOINT =
  process.env.GITHUB_MODELS_ENDPOINT ?? "https://models.github.ai/inference";
