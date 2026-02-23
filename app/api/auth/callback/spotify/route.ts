import { NextRequest, NextResponse } from "next/server";
import { exchangeCode, getSpotifyProfile } from "@/lib/spotify";
import { createSession } from "@/lib/session";
import { APP_URL } from "@/lib/config";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}?error=access_denied`);
  }

  try {
    const tokens = await exchangeCode(code);
    const profile = await getSpotifyProfile(tokens.access_token);

    await createSession({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      user: {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        image: profile.images?.[0]?.url,
      },
    });

    return NextResponse.redirect(`${APP_URL}/dashboard`);
  } catch (err) {
    console.error("[auth/callback] error:", err);
    return NextResponse.redirect(`${APP_URL}?error=auth_failed`);
  }
}
