import OpenAI from "openai";
import { GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT } from "./config";

// using GitHub Models free tier - swappable for any model on the marketplace
const MODEL = "openai/gpt-4o-mini";

const client = new OpenAI({
  baseURL: GITHUB_MODELS_ENDPOINT,
  apiKey: GITHUB_TOKEN,
});

export interface TrackSeed {
  name: string;
  artist: string;
}

export interface Recommendation {
  name: string;
  artist: string;
  reason: string;
}

export async function getRecommendations(
  topTracks: TrackSeed[],
): Promise<Recommendation[]> {
  const trackList = topTracks
    .slice(0, 20)
    .map((t, i) => `${i + 1}. "${t.name}" by ${t.artist}`)
    .join("\n");

  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not set");

  // TODO: maybe add genre/mood filtering later
  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a music taste expert. Based on someone's top Spotify tracks, suggest 6 songs they'd probably enjoy but haven't listed.
Only respond with JSON like this - no extra text:
{"recommendations": [{"name": "song title", "artist": "artist name", "reason": "one sentence why they'd like it"}]}`,
      },
      {
        role: "user",
        content: `Here are my top tracks:\n${trackList}\n\nRecommend 6 songs I'd love.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.recommendations ?? [];
}
