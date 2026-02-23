import { NextResponse } from "next/server";
import {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URI,
  SPOTIFY_SCOPES,
} from "@/lib/config";

export function GET() {
  // useful for debugging - make sure this matches exactly what's in the Spotify dashboard
  console.log("redirect_uri:", SPOTIFY_REDIRECT_URI);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SPOTIFY_SCOPES,
    // force consent screen so updated scopes are always granted
    show_dialog: "true",
  });

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return NextResponse.redirect(spotifyAuthUrl);
}
