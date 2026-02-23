import { NextResponse } from "next/server";
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from "@/lib/config";

export function GET() {
  // Log the exact redirect URI so it can be copy-pasted into the Spotify dashboard
  console.log("[spotify signin] redirect_uri:", SPOTIFY_REDIRECT_URI);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    show_dialog: "false",
  });

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return NextResponse.redirect(spotifyAuthUrl);
}
