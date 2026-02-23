import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getTopArtists } from "@/lib/spotify";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artists = await getTopArtists(session.accessToken);
    return NextResponse.json({ artists });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "failed to fetch artists";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
