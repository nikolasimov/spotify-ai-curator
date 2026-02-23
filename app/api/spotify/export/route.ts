import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  createPlaylist,
  addTracksToPlaylist,
  searchTrack,
} from "@/lib/spotify";

interface ExportBody {
  name: string;
  description: string;
  recommendations: { name: string; artist: string }[];
}

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: ExportBody = await req.json();

    // search Spotify for each recommended track to get playable URIs
    const uris: string[] = [];
    for (const rec of body.recommendations) {
      const uri = await searchTrack(
        session.accessToken,
        `${rec.name} ${rec.artist}`,
      );
      if (uri) uris.push(uri);
    }

    if (uris.length === 0) {
      return NextResponse.json(
        { error: "Couldn't find any of those tracks on Spotify" },
        { status: 404 },
      );
    }

    // create the playlist and populate it
    const playlist = await createPlaylist(
      session.accessToken,
      session.user.id,
      body.name,
      body.description,
    );

    await addTracksToPlaylist(session.accessToken, playlist.id, uris);

    return NextResponse.json({
      url: playlist.external_urls.spotify,
      name: body.name,
      trackCount: uris.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "export failed";
    console.error("export failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
