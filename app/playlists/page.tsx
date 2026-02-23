import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import CursorTrail from "@/components/cursor-trail";
import Nav from "@/components/nav";
import PlaylistsShell from "@/components/playlists-shell";

export default async function PlaylistsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CursorTrail />
      <div className="relative z-10">
        <Nav />
        <div className="px-6 py-10">
          <PlaylistsShell />
        </div>
      </div>
    </main>
  );
}
