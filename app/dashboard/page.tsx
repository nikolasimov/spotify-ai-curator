import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Image from "next/image";
import RecommendationsPanel from "@/components/recommendations-panel";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { user } = session;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-5 h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-white/5">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-violet-300">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>

        <span className="inline-flex rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs font-medium tracking-widest text-violet-300 uppercase">
          Connected
        </span>

        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
          {user.name}
        </h1>

        <p className="mt-2 text-sm text-white/50">{user.email}</p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl text-left">
            <p className="text-xs tracking-wide text-white/40 uppercase">
              Status
            </p>
            <p className="mt-2 text-sm text-white/80">
              Spotify account linked. Listening data is accessible.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/4 p-5 backdrop-blur-xl text-left">
            <p className="text-xs tracking-wide text-white/40 uppercase">
              Next up
            </p>
            <p className="mt-2 text-sm text-white/80">
              Taste analysis and AI recommendations — coming soon.
            </p>
          </article>
        </div>

        <RecommendationsPanel />

        <a
          href="/api/auth/signout"
          className="mt-10 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white/60 hover:text-white/90"
        >
          Sign out
        </a>
      </div>
    </main>
  );
}
