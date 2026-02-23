import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

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

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
