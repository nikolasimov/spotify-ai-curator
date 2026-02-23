import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopTracks, searchTrack } from "@/lib/spotify";
import { getRecommendations } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mood, tracks, artists, count } = body;

    // if the user didn't select anything manually, fall back to their top tracks
    let trackSeeds = tracks ?? [];
    let artistSeeds = artists ?? [];

    if (trackSeeds.length === 0 && artistSeeds.length === 0) {
      const topTracks = await getTopTracks(session.accessToken, 10);
      trackSeeds = topTracks.map((t) => ({
        name: t.name,
        artist: t.artists[0]?.name ?? "Unknown",
      }));
    }

    const aiResult = await getRecommendations({
      mood: mood ?? "",
      tracks: trackSeeds,
      artists: artistSeeds,
      count: count ?? 8,
    });

    // resolve each recommendation on Spotify to get URIs + album art
    const enriched = await Promise.all(
      aiResult.recommendations.map(async (rec) => {
        const result = await searchTrack(
          session.accessToken,
          rec.name,
          rec.artist,
        );
        return {
          name: result?.name ?? rec.name,
          artist: result?.artist ?? rec.artist,
          reason: rec.reason,
          uri: result?.uri ?? null,
          albumArt: result?.albumArt ?? null,
        };
      }),
    );

    return NextResponse.json({
      playlistName: aiResult.playlistName,
      playlistDescription: aiResult.playlistDescription,
      recommendations: enriched,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "something went wrong";
    console.error("recommendations failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
