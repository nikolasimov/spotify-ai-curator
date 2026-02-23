"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// ─── types ──────────────────────────────────────────────────────────────────

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  uri: string;
}

interface Artist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string }[];
}

interface Recommendation {
  name: string;
  artist: string;
  reason: string;
  uri: string | null;
  albumArt: string | null;
}

interface ExportResult {
  url: string;
  name: string;
  trackCount: number;
  warning?: string;
}

interface Props {
  user: { name: string; image?: string };
}

// ─── component ──────────────────────────────────────────────────────────────

export default function DashboardShell({ user }: Props) {
  // browsing data
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [activeTab, setActiveTab] = useState<"tracks" | "artists">("tracks");
  const [loadingData, setLoadingData] = useState(true);

  // prompt + selections
  const [prompt, setPrompt] = useState("");
  const [playlistSize, setPlaylistSize] = useState(8);
  const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);

  // generation
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [generating, setGenerating] = useState(false);

  // export
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ─── fetch top tracks & artists on mount ────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [tracksRes, artistsRes] = await Promise.all([
          fetch("/api/spotify/top-tracks"),
          fetch("/api/spotify/top-artists"),
        ]);

        if (tracksRes.ok) {
          const data = await tracksRes.json();
          setTopTracks(data.tracks ?? []);
        }
        if (artistsRes.ok) {
          const data = await artistsRes.json();
          setTopArtists(data.artists ?? []);
        }
      } catch (err) {
        console.error("failed to load music data:", err);
      } finally {
        setLoadingData(false);
      }
    }

    load();
  }, []);

  // ─── toggle selections ─────────────────────────────────────────────────

  const toggleTrack = useCallback((track: Track) => {
    setSelectedTracks((prev) => {
      const exists = prev.find((t) => t.id === track.id);
      return exists ? prev.filter((t) => t.id !== track.id) : [...prev, track];
    });
  }, []);

  const toggleArtist = useCallback((artist: Artist) => {
    setSelectedArtists((prev) => {
      const exists = prev.find((a) => a.id === artist.id);
      return exists
        ? prev.filter((a) => a.id !== artist.id)
        : [...prev, artist];
    });
  }, []);

  // ─── generate recommendations ──────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    setExportResult(null);

    try {
      const res = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: prompt,
          count: playlistSize,
          tracks: selectedTracks.map((t) => ({
            name: t.name,
            artist: t.artists[0]?.name ?? "Unknown",
          })),
          artists: selectedArtists.map((a) => ({
            name: a.name,
            genres: a.genres,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "generation failed");
      setRecommendations(data.recommendations ?? []);
      setPlaylistName(data.playlistName ?? "AI Curator Picks");
      setPlaylistDescription(data.playlistDescription ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      setGenerating(false);
    }
  }, [prompt, playlistSize, selectedTracks, selectedArtists]);

  // ─── export to Spotify ─────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (recommendations.length === 0) return;

    setExporting(true);
    setError(null);

    try {
      // only export tracks that were found on Spotify
      const exportable = recommendations.filter((r) => r.uri);

      if (exportable.length === 0) {
        setError("None of these tracks were found on Spotify.");
        setExporting(false);
        return;
      }

      const res = await fetch("/api/spotify/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistName,
          playlistDescription,
          tracks: exportable.map((r) => ({
            uri: r.uri,
            name: r.name,
            artist: r.artist,
          })),
        }),
      });

      const data = await res.json();

      if (data.needsReauth) {
        setNeedsReauth(true);
        return;
      }

      if (!res.ok) throw new Error(data.error ?? "export failed");
      setExportResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "export failed");
    } finally {
      setExporting(false);
    }
  }, [recommendations, playlistName, playlistDescription]);

  // ─── helpers ────────────────────────────────────────────────────────────

  const canGenerate =
    prompt.trim().length > 0 ||
    selectedTracks.length > 0 ||
    selectedArtists.length > 0;

  const hasSeeds = selectedTracks.length > 0 || selectedArtists.length > 0;

  // ─── render ─────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* ── greeting ──────────────────────────────────────────────────── */}
      <section className="mb-12 text-center">
        <div className="relative mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full border border-white/15 bg-white/5">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-violet-300">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white">
          Hey, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-white/40">
          What are you in the mood for?
        </p>
      </section>

      {/* ── mood prompt ───────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1 backdrop-blur-xl">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="I want something dreamy and nostalgic, like driving at night..."
            rows={3}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm text-white placeholder-white/25 outline-none"
          />
        </div>

        {/* playlist size slider */}
        <div className="mt-4 flex items-center gap-4 px-1">
          <label className="text-xs text-white/40 whitespace-nowrap">
            Playlist size
          </label>
          <input
            type="range"
            min={4}
            max={30}
            value={playlistSize}
            onChange={(e) => setPlaylistSize(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 accent-violet-400 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-400"
          />
          <span className="min-w-[2rem] text-center text-xs font-medium text-violet-300">
            {playlistSize}
          </span>
        </div>

        {/* selected seeds show as removable chips */}
        {hasSeeds && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedTracks.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTrack(t)}
                className="group flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <span className="max-w-[150px] truncate">♪ {t.name}</span>
                <span className="text-emerald-400/50 group-hover:text-emerald-300">
                  ×
                </span>
              </button>
            ))}
            {selectedArtists.map((a) => (
              <button
                key={a.id}
                onClick={() => toggleArtist(a)}
                className="group flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 transition hover:bg-violet-500/20"
              >
                <span className="max-w-[150px] truncate">★ {a.name}</span>
                <span className="text-violet-400/50 group-hover:text-violet-300">
                  ×
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── tabs: top tracks / top artists ────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4 flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1">
          <button
            onClick={() => setActiveTab("tracks")}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition ${
              activeTab === "tracks"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Your Top Tracks
          </button>
          <button
            onClick={() => setActiveTab("artists")}
            className={`flex-1 rounded-lg px-4 py-2 text-xs font-medium transition ${
              activeTab === "artists"
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            Your Top Artists
          </button>
        </div>

        <p className="mb-3 text-center text-xs text-white/25">
          Click to add to your prompt
        </p>

        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
            <span className="ml-2 text-sm text-white/40">
              Loading your music...
            </span>
          </div>
        ) : activeTab === "tracks" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {topTracks.map((track) => {
              const selected = selectedTracks.some((t) => t.id === track.id);
              const art = track.album.images?.[0]?.url;

              return (
                <button
                  key={track.id}
                  onClick={() => toggleTrack(track)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-emerald-400/30 bg-emerald-500/10"
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {art ? (
                      <Image
                        src={art}
                        alt={track.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/20">
                        ♪
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {track.name}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {topArtists.map((artist) => {
              const selected = selectedArtists.some(
                (a) => a.id === artist.id,
              );
              const img = artist.images?.[0]?.url;

              return (
                <button
                  key={artist.id}
                  onClick={() => toggleArtist(artist)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition ${
                    selected
                      ? "border-violet-400/30 bg-violet-500/10"
                      : "border-white/8 bg-white/[0.02] hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-full bg-white/5">
                    {img ? (
                      <Image
                        src={img}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-white/20">
                        ★
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-white">
                    {artist.name}
                  </p>
                  <p className="line-clamp-1 text-xs text-white/30">
                    {artist.genres?.slice(0, 2).join(", ") || "—"}
                  </p>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                      <CheckIcon />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── generate button ───────────────────────────────────────────── */}
      <section className="mb-12 text-center">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="inline-flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-indigo-600/10 px-8 py-3.5 text-sm font-semibold text-violet-200 shadow-lg shadow-violet-900/20 backdrop-blur-sm transition hover:from-violet-500/30 hover:to-indigo-600/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? (
            <>
              <Spinner />
              Curating your playlist...
            </>
          ) : (
            <>
              <SparkleIcon />
              Generate Recommendations
            </>
          )}
        </button>

        {!canGenerate && (
          <p className="mt-3 text-xs text-white/25">
            Describe your mood or select some tracks and artists to get started
          </p>
        )}
      </section>

      {/* ── error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-8 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-center text-sm text-red-300">
          <p>{error}</p>
        </div>
      )}

      {/* ── recommendations (playlist view) ────────────────────────────── */}
      {recommendations.length > 0 && (
        <section className="mb-12">
          {/* ── playlist header ─────────────────────────────────────────── */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-indigo-600/15 to-fuchsia-600/10 p-6 backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
              {/* mosaic cover from first 4 album arts */}
              <div className="relative h-36 w-36 flex-shrink-0 self-center overflow-hidden rounded-xl shadow-xl shadow-violet-900/30 sm:self-auto">
                {(() => {
                  const covers = recommendations
                    .filter((r) => r.albumArt)
                    .slice(0, 4)
                    .map((r) => r.albumArt!);
                  if (covers.length >= 4) {
                    return (
                      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                        {covers.map((url, i) => (
                          <div key={i} className="relative">
                            <Image
                              src={url}
                              alt=""
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    );
                  }
                  if (covers.length > 0) {
                    return (
                      <Image
                        src={covers[0]}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    );
                  }
                  return (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/40 to-indigo-700/40">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="text-violet-200/60"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                  );
                })()}
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="text-xs font-medium uppercase tracking-widest text-violet-300/60">
                  AI Generated Playlist
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
                  {playlistName}
                </h2>
                {playlistDescription && (
                  <p className="mt-2 text-sm text-white/40">
                    {playlistDescription}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-center gap-3 text-xs text-white/30 sm:justify-start">
                  <span>
                    {recommendations.filter((r) => r.uri).length} track
                    {recommendations.filter((r) => r.uri).length !== 1
                      ? "s"
                      : ""}{" "}
                    found on Spotify
                  </span>
                  <span className="text-white/15">•</span>
                  <span>Curated by AI</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── track list ──────────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-xl border border-white/8 bg-white/[0.02]">
            {/* header row */}
            <div className="grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 border-b border-white/8 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white/25 sm:grid-cols-[2rem_2.5rem_1fr_1fr]">
              <span className="text-center">#</span>
              <span />
              <span>Title</span>
              <span className="hidden sm:block">Why this song</span>
            </div>

            {/* track rows */}
            {recommendations.map((rec, i) => (
              <div
                key={i}
                className={`group grid grid-cols-[2rem_2.5rem_1fr_auto] items-center gap-3 border-b border-white/[0.04] px-4 py-2.5 transition last:border-b-0 hover:bg-white/[0.03] sm:grid-cols-[2rem_2.5rem_1fr_1fr] ${
                  !rec.uri ? "opacity-40" : ""
                }`}
              >
                {/* number */}
                <span className="text-center text-sm tabular-nums text-white/25 group-hover:text-white/40">
                  {i + 1}
                </span>

                {/* album art */}
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-white/5">
                  {rec.albumArt ? (
                    <Image
                      src={rec.albumArt}
                      alt={rec.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/15">
                      ♪
                    </div>
                  )}
                </div>

                {/* title + artist */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {rec.name}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {rec.artist}
                    {!rec.uri && (
                      <span className="ml-2 text-red-400/60">
                        · not on Spotify
                      </span>
                    )}
                  </p>
                </div>

                {/* reason (hidden on mobile, visible on desktop) */}
                <p className="hidden truncate text-xs text-white/25 sm:block">
                  {rec.reason}
                </p>
              </div>
            ))}
          </div>

          {/* ── export actions ──────────────────────────────────────────── */}
          <div className="mt-6 flex flex-col items-center gap-4">
            {exportResult ? (
              <div className="flex flex-col items-center gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-green-400/20 bg-green-500/10 px-6 py-3 text-sm font-medium text-green-300">
                  <CheckCircleIcon />
                  {exportResult.trackCount > 0
                    ? `Playlist saved · ${exportResult.trackCount} tracks on Spotify`
                    : "Playlist created on Spotify"}
                </div>
                {exportResult.warning && (
                  <p className="max-w-sm text-center text-xs text-amber-300/80">
                    {exportResult.warning}
                  </p>
                )}
                <a
                  href={exportResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
                >
                  <SpotifyIcon />
                  Open &ldquo;{exportResult.name}&rdquo; in Spotify
                </a>
              </div>
            ) : needsReauth ? (
              /* ── needs fresh Spotify auth with playlist scopes ────────── */
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-6 py-5 text-center">
                <p className="text-sm font-medium text-amber-200">
                  Spotify needs one-time permission to create playlists
                </p>
                <p className="max-w-xs text-xs text-amber-200/60">
                  Your current session was created before playlist permissions
                  were added. Click below to reconnect — Spotify will ask you
                  to approve playlist access, then you&apos;ll come right back.
                </p>
                <a
                  href="/api/auth/signin/spotify"
                  className="inline-flex items-center gap-2 rounded-full bg-[#1DB954] px-6 py-2.5 text-sm font-semibold text-black transition hover:bg-[#1ed760]"
                >
                  <SpotifyIcon />
                  Grant playlist permission
                </a>
                <p className="text-xs text-amber-200/40">
                  You&apos;ll need to generate your playlist again after reconnecting.
                </p>
              </div>
            ) : (
              <button
                onClick={handleExport}
                disabled={
                  exporting ||
                  recommendations.filter((r) => r.uri).length === 0
                }
                className="inline-flex items-center gap-2.5 rounded-full bg-[#1DB954] px-8 py-3 text-sm font-semibold text-black shadow-lg shadow-green-900/20 transition hover:bg-[#1ed760] hover:shadow-green-900/30 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Spinner />
                    Creating playlist...
                  </>
                ) : (
                  <>
                    <SpotifyIcon />
                    Export to Spotify
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => {
                setRecommendations([]);
                setExportResult(null);
                setPlaylistName("");
                setPlaylistDescription("");
                setNeedsReauth(false);
              }}
              className="text-xs text-white/25 transition hover:text-white/50"
            >
              Generate again
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── small icons (inline to avoid extra dependencies) ───────────────────────

function SparkleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

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

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
