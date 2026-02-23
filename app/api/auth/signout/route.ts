import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/session";
import { APP_URL } from "@/lib/config";

export async function GET() {
  await deleteSession();
  return NextResponse.redirect(`${APP_URL}`);
}
