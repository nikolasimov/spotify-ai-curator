"use client";

import { useState } from "react";

interface Recommendation {
  name: string;
  artist: string;
  reason: string;
}

export default function RecommendationsPanel() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/recommend");
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setRecs(data.recommendations ?? []);
      setDone(true);
    } catch {
      setError("Could not generate recommendations. Check your GitHub token.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 w-full">
      {!done && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mx-auto flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-6 py-3 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Spinner />
              Analysing your tracks...
            </>
          ) : (
            <>
              <SparkleIcon />
              Get AI Recommendations
            </>
          )}
        </button>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-400">{error}</p>
      )}

      {recs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-center text-xs font-semibold tracking-widest text-violet-300 uppercase">
            Recommended for you
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recs.map((r, i) => (
              <li
                key={i}
                className="rounded-2xl border border-white/10 bg-white/4 p-4 backdrop-blur-xl"
              >
                <p className="font-semibold text-white">{r.name}</p>
                <p className="text-sm text-white/50">{r.artist}</p>
                <p className="mt-2 text-xs text-white/40">{r.reason}</p>
              </li>
            ))}
          </ul>
          <button
            onClick={() => { setDone(false); setRecs([]); }}
            className="mx-auto mt-6 flex text-xs text-white/30 hover:text-white/60 transition"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
