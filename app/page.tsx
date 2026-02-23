import CursorTrail from "@/components/cursor-trail";

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

const features = [
  {
    title: "Spotify Profile Access",
    description:
      "Connects to your Spotify account via OAuth to read your top artists, tracks, and listening history.",
  },
  {
    title: "AI Recommendations",
    description:
      "Uses GitHub Models AI to build a taste profile and surface songs you haven't heard yet but will likely enjoy.",
  },
  {
    title: "Playlist Creation",
    description:
      "Curates and saves new playlists directly to your Spotify library based on your listening patterns.",
  },
  {
    title: "Dockerized",
    description:
      "Fully containerized with Docker and Compose. Clone the repo, fill in env vars, and run with a single command.",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20">
      <CursorTrail />
      <div className="relative z-10 flex w-full flex-col items-center">
      {/* centered hero */}
      <section className="flex w-full max-w-2xl flex-col items-center text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white lg:text-6xl">
          Spotify{" "}
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            AI Curator
          </span>
        </h1>

        <span className="mt-4 inline-flex rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 text-xs font-medium tracking-widest text-violet-300 uppercase">
          Portfolio Project
        </span>

        <p className="mt-6 text-base leading-7 text-white/60 lg:text-lg">
          Connect your Spotify account to get personalised playlists and music
          recommendations driven by your actual listening habits.
        </p>

        {/* tech badges */}
        <div className="mt-7 flex flex-wrap justify-center gap-2 text-xs">
          {["Next.js", "TypeScript", "Docker", "Spotify API", "GitHub AI"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70"
              >
                {tag}
              </span>
            ),
          )}
        </div>

        {/* CTA */}
        <div className="mt-10">
          <a
            href="/api/auth/signin/spotify"
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-2xl border border-green-400/40 bg-gradient-to-br from-green-500/20 to-emerald-600/10 px-7 py-3.5 text-sm font-semibold text-green-300 shadow-lg shadow-green-900/20 backdrop-blur-sm"
          >
            <SpotifyIcon />
            <span>Connect with Spotify</span>
            <span className="ml-1 text-green-400/70">&rarr;</span>
          </a>
        </div>
      </section>

      {/* feature cards */}
      <section className="mx-auto mt-20 w-full max-w-4xl">
        <p className="mb-6 text-center text-xs font-medium tracking-widest text-white/30 uppercase">
          What it does
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-white/8 bg-white/4 p-5 backdrop-blur-xl"
            >
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-white/60">
                {f.description}
              </p>
            </article>
          ))}
        </div>
      </section>
      </div>
    </main>
  );
}
