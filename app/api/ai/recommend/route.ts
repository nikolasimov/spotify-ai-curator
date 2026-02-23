import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopTracks } from "@/lib/spotify";
import { getRecommendations } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { mood, tracks, artists } = body;

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

    const recommendations = await getRecommendations({
      mood: mood ?? "",
      tracks: trackSeeds,
      artists: artistSeeds,
    });

    return NextResponse.json({ recommendations });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "something went wrong";
    console.error("recommendations failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
