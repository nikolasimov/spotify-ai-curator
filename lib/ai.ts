import OpenAI from "openai";
import { GITHUB_TOKEN, GITHUB_MODELS_ENDPOINT } from "./config";

// GitHub Models is accessed via the OpenAI-compatible API.
// Set baseURL to GitHub's inference endpoint and use your GitHub PAT as the key.
// Pick any model from: https://github.com/marketplace/models
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

  const response = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a music recommendation engine. 
Given a user's top Spotify tracks, suggest 6 new songs they haven't listed that they would likely enjoy.
Respond ONLY with valid JSON in this exact shape:
{"recommendations": [{"name": "...", "artist": "...", "reason": "..."}]}
Reasons should be 1 short sentence explaining the connection to their taste.`,
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
