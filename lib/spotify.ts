import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI,
} from "./config";

// ─── shared types ───────────────────────────────────────────────────────────

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  expires_in: number;
  refresh_token: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  followers: { total: number };
  country: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
  uri: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
  popularity: number;
  external_urls: { spotify: string };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

// ─── auth helpers ───────────────────────────────────────────────────────────

function basicAuth() {
  return Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString(
    "base64",
  );
}

export async function exchangeCode(
  code: string,
): Promise<SpotifyTokenResponse> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<SpotifyTokenResponse> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth()}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Token refresh failed: ${res.status}`);
  }

  return res.json();
}

// ─── user data ──────────────────────────────────────────────────────────────

export async function getSpotifyProfile(
  accessToken: string,
): Promise<SpotifyUserProfile> {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Spotify profile: ${res.status}`);
  }

  return res.json();
}

export async function getTopTracks(
  accessToken: string,
  limit = 20,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch top tracks: ${res.status}`);
  }

  const data = await res.json();
  return data.items as SpotifyTrack[];
}

export async function getTopArtists(
  accessToken: string,
  limit = 20,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
): Promise<SpotifyArtist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${timeRange}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch top artists: ${res.status}`);
  }

  const data = await res.json();
  return data.items as SpotifyArtist[];
}

// ─── playlists ──────────────────────────────────────────────────────────────

export async function getUserPlaylists(
  accessToken: string,
  limit = 50,
): Promise<SpotifyPlaylist[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Spotify playlists error:", res.status, errorData);
    throw new Error(
      `Failed to fetch playlists (${res.status}). Try signing out and back in.`,
    );
  }

  const data = await res.json();
  // Spotify can return null items for deleted/unavailable playlists
  const items = (data.items ?? []).filter(
    (item: SpotifyPlaylist | null) => item !== null,
  );
  return items as SpotifyPlaylist[];
}

export async function createPlaylist(
  accessToken: string,
  userId: string,
  name: string,
  description = "",
): Promise<{ id: string; external_urls: { spotify: string } }> {
  try {
    const res = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description, public: false }),
      },
    );

    if (!res.ok) {
      // return detailed error for better debugging
      const errorData = await res.json().catch(() => ({}));
      console.error("Spotify createPlaylist error:", res.status, errorData);
      throw new Error(
        `Failed to create playlist (${res.status}). You may need to sign out and sign in again to update permissions.`,
      );
    }

    return res.json();
  } catch (err) {
    throw err;
  }
}

export async function addTracksToPlaylist(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: trackUris }),
    },
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Spotify addTracks error:", res.status, errorData);
    throw new Error(
      `Failed to add tracks (${res.status}). Permission error or invalid IDs.`,
    );
  }
}

// ─── search ─────────────────────────────────────────────────────────────────

export async function searchTrack(
  accessToken: string,
  trackName: string,
  artistName: string,
): Promise<{ uri: string; name: string; artist: string } | null> {
  // clean up the query — strip stuff like "(feat. X)", "[Deluxe]", etc.
  const cleanName = trackName.replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, "").trim();
  const cleanArtist = artistName.replace(/\s*[\(\[][^\)\]]*[\)\]]\s*/g, "").trim();

  // try exact search first: track:"name" artist:"artist"
  const exactQuery = `track:${cleanName} artist:${cleanArtist}`;
  const exactRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(exactQuery)}&type=track&limit=3`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (exactRes.ok) {
    const data = await exactRes.json();
    const track = data.tracks?.items?.[0];
    if (track?.uri) {
      return {
        uri: track.uri,
        name: track.name,
        artist: track.artists?.[0]?.name ?? artistName,
      };
    }
  }

  // fallback: looser search with just the text
  const fallbackRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(`${cleanName} ${cleanArtist}`)}&type=track&limit=3`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!fallbackRes.ok) return null;

  const fallbackData = await fallbackRes.json();
  const fallbackTrack = fallbackData.tracks?.items?.[0];
  if (!fallbackTrack?.uri) return null;

  return {
    uri: fallbackTrack.uri,
    name: fallbackTrack.name,
    artist: fallbackTrack.artists?.[0]?.name ?? artistName,
  };
}
