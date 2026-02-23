import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopTracks } from "@/lib/spotify";
import { getRecommendations } from "@/lib/ai";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tracks = await getTopTracks(session.accessToken);

    const seeds = tracks.map((t) => ({
      name: t.name,
      artist: t.artists[0]?.name ?? "Unknown",
    }));

    const recommendations = await getRecommendations(seeds);

    return NextResponse.json({ recommendations, seeds });
  } catch (err) {
    console.error("[ai/recommend] error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
