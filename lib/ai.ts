import OpenAI from "openai";
import { GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT } from "./config";

// using GitHub Models free tier — swappable for any OpenAI-compatible endpoint
const MODEL = "openai/gpt-4o-mini";

const client = new OpenAI({
  baseURL: GITHUB_MODELS_ENDPOINT,
  apiKey: GITHUB_TOKEN,
});

// ─── types ──────────────────────────────────────────────────────────────────

export interface RecommendationInput {
  mood: string;
  tracks: { name: string; artist: string }[];
  artists: { name: string; genres?: string[] }[];
  count: number;
}

export interface Recommendation {
  name: string;
  artist: string;
  reason: string;
}

// ─── main function ──────────────────────────────────────────────────────────

export async function getRecommendations(
  input: RecommendationInput,
): Promise<Recommendation[]> {
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

  // build a natural-sounding message from whatever the user gave us
  const parts: string[] = [];

  if (input.mood.trim()) {
    parts.push(`Here's what I'm feeling: ${input.mood}`);
  }

  if (input.tracks.length > 0) {
    const list = input.tracks
      .map((t, i) => `${i + 1}. "${t.name}" by ${t.artist}`)
      .join("\n");
    parts.push(`Songs I'm vibing with right now:\n${list}`);
  }

  if (input.artists.length > 0) {
    const list = input.artists
      .map((a) => {
        const genres = a.genres?.length
          ? ` (${a.genres.slice(0, 3).join(", ")})`
          : "";
        return `- ${a.name}${genres}`;
      })
      .join("\n");
    parts.push(`Artists I love:\n${list}`);
  }

  const count = Math.min(Math.max(input.count || 8, 4), 30);

  parts.push(
    `Based on all of this, recommend ${count} songs that match my mood and taste.`,
  );

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a music curator with deep, eclectic taste. The user is telling you how they feel and sharing music they love. Your job is to recommend songs that match their current mood while respecting their taste.

Guidelines:
- Recommend exactly ${count} songs they haven't mentioned
- Mix well-known tracks with deeper cuts — don't just suggest Top 40
- Each recommendation should feel intentional, not algorithmic
- Consider the mood description, the genres implied by their artists, and the energy of their tracks
- Write reasons like a friend who knows music well — personal and specific, not generic

Only respond with JSON, no extra text:
{"recommendations": [{"name": "song title", "artist": "artist name", "reason": "why they'd love it"}]}`,
      },
      {
        role: "user",
        content: parts.join("\n\n"),
      },
    ],
    temperature: 0.85,
    max_tokens: Math.max(1200, count * 150),
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.recommendations ?? [];
}
