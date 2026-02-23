import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserPlaylists } from "@/lib/spotify";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await getUserPlaylists(session.accessToken);
    return NextResponse.json({ playlists });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "failed to fetch playlists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
