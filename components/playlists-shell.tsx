"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ─── types ──────────────────────────────────────────────────────────────────

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  owner: { display_name: string };
  external_urls: { spotify: string };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function PlaylistsShell() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/spotify/playlists");
        if (res.ok) {
          const data = await res.json();
          setPlaylists(data.playlists || []);
        } else {
          const data = await res.json().catch(() => ({}));
          setError(
            data.error || "Failed to load playlists. Try signing in again.",
          );
        }
      } catch (err) {
        setError("Failed to load playlists.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
        <span className="ml-2 text-sm text-white/40">
          Loading your playlists...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-sm text-red-300">{error}</p>
        <a
          href="/api/auth/signout"
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 hover:bg-red-500/20"
        >
          Sign out & Reconnect
        </a>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-white/40">No playlists found.</p>
        <p className="mt-1 text-xs text-white/25">
          Generate some recommendations and export them to see playlists here.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <section className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Your Playlists</h1>
        <p className="mt-1 text-sm text-white/40">
          {playlists.length} playlists in your library
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((pl) => {
          const cover = pl.images?.[0]?.url;

          return (
            <a
              key={pl.id}
              href={pl.external_urls?.spotify ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-2xl border border-white/8 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-xl bg-white/5">
                {cover ? (
                  <Image
                    src={cover}
                    alt={pl.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl text-white/10">
                    ♪
                  </div>
                )}
              </div>
              <p className="truncate text-sm font-semibold text-white group-hover:text-white/90">
                {pl.name}
              </p>
              <p className="mt-0.5 text-xs text-white/30">
                {pl.tracks?.total ?? 0} tracks ·{" "}
                {pl.owner?.display_name ?? "Unknown"}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

// ─── spinner ────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
