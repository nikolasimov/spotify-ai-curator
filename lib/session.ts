import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { refreshAccessToken } from "./spotify";

const COOKIE_NAME = "sac_session";
const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET ?? "dev-secret-change-me-in-env",
);

export interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  user: SpotifyUser;
}

export async function createSession(data: Session): Promise<void> {
  const token = await new SignJWT(data as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}

/**
 * Returns the current session. If the Spotify access token has expired,
 * it automatically refreshes it using the stored refresh token and
 * updates the session cookie so subsequent requests use the new token.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const session = payload as unknown as Session;

    // check if the Spotify access token has expired (with 5 min buffer)
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000;

    if (session.expiresAt && now >= session.expiresAt - bufferMs) {
      try {
        const refreshed = await refreshAccessToken(session.refreshToken);

        const updatedSession: Session = {
          ...session,
          accessToken: refreshed.access_token,
          // Spotify may or may not return a new refresh token
          refreshToken: refreshed.refresh_token ?? session.refreshToken,
          expiresAt: Date.now() + refreshed.expires_in * 1000,
          // refreshed tokens keep the same scopes as the original auth
          scope: session.scope ?? "",
        };

        // persist the refreshed session
        await createSession(updatedSession);
        return updatedSession;
      } catch (err) {
        console.error("token refresh failed:", err);
        // return stale session — let the caller handle the 401/403
        return session;
      }
    }

    return session;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
