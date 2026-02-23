import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { APP_URL } from "@/lib/config";

// browser navigation — clears session and redirects to landing
export async function GET() {
  await deleteSession();
  return NextResponse.redirect(`${APP_URL}`);
}

// API call — clears session and returns JSON (no redirect)
export async function POST() {
  await deleteSession();
  return NextResponse.json({ ok: true });
}
