# Spotify AI Curator

> A Next.js app that connects to your Spotify, reads your listening habits, and uses AI to curate playlists that match your mood. You tell it how you're feeling, pick some favorite tracks and artists, and it recommends songs you'll actually want to hear — then exports them straight to your Spotify library.

🔗 **Live demo:** [spotify-ai-curator.vercel.app](https://spotify-ai-curator.vercel.app)

---

## What it does

1. **Connects to Spotify** via OAuth 2.0 — reads your top tracks, top artists, and playlists
2. **You describe your mood** in a free-text prompt ("I want something dreamy and nostalgic…")
3. **You pick seeds** — click on your top tracks and artists to add them as context for the AI
4. **AI generates recommendations** — 8 songs that match your mood and taste, with personal reasons for each
5. **Export to Spotify** — one click creates a new playlist in your library with the recommended tracks

---

## How everything connects

Here's the full flow from login to exported playlist:

```
┌─────────────┐     OAuth 2.0      ┌─────────────────┐
│  Landing     │ ─────────────────→ │  Spotify Auth    │
│  page.tsx    │                    │  (accounts.api)  │
└─────────────┘                    └────────┬────────┘
                                            │ callback with code
                                            ▼
                               ┌────────────────────────┐
                               │  /api/auth/callback     │
                               │  exchanges code → token │
                               │  fetches profile        │
                               │  creates JWT session    │
                               └────────────┬───────────┘
                                            │ redirect
                                            ▼
┌──────────────────────────────────────────────────────────────┐
│                     Dashboard                                │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Mood Prompt (textarea)                              │    │
│  │  "I want something dreamy and nostalgic..."          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Selected seeds: [♪ Track A] [♪ Track B] [★ Artist C]       │
│                                                              │
│  ┌──────────────────┬───────────────────┐                   │
│  │  Your Top Tracks  │  Your Top Artists  │  ← click to add │
│  │  (from Spotify)   │  (from Spotify)    │                  │
│  └──────────────────┴───────────────────┘                   │
│                                                              │
│  [ ✨ Generate Recommendations ]                             │
│         │                                                    │
│         │  POST /api/ai/recommend                            │
│         │  { mood, tracks, artists }                         │
│         ▼                                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  AI Recommendations (8 songs)                        │    │
│  │  Each with: name, artist, personal reason            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  [ 🟢 Export to Spotify ]                                    │
│         │                                                    │
│         │  POST /api/spotify/export                          │
│         │  1. Searches each song on Spotify                  │
│         │  2. Creates a new playlist                         │
│         │  3. Adds found tracks                              │
│         ▼                                                    │
│  ✅ Saved 7 tracks → "AI: dreamy and nostalgic…"             │
│     Open on Spotify →                                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Tech stack

| Layer     | Tech                                      |
| --------- | ----------------------------------------- |
| Framework | Next.js (App Router, TypeScript)          |
| Styling   | Tailwind CSS v4                           |
| Auth      | Spotify OAuth 2.0 + JWT cookies (jose)    |
| AI        | GitHub Models API (free inference tokens) |
| Hosting   | Vercel                                    |

---

## Project structure

```
app/
  page.tsx                              # Landing page — glassmorphism hero + connect button
  layout.tsx                            # Root layout, fonts, global CSS
  globals.css                           # Dark theme with radial gradient background
  dashboard/
    page.tsx                            # Server component — checks session, renders DashboardShell
  playlists/
    page.tsx                            # Server component — checks session, renders PlaylistsShell
  api/
    auth/
      signin/spotify/route.ts          # Redirects to Spotify OAuth authorize URL
      callback/spotify/route.ts        # Exchanges code for tokens, creates JWT session
      signout/route.ts                 # Clears session cookie, redirects home
    ai/
      recommend/route.ts               # POST — sends mood + seeds to AI, returns recommendations
    spotify/
      top-tracks/route.ts              # GET — returns user's top 20 tracks from Spotify
      top-artists/route.ts             # GET — returns user's top 20 artists from Spotify
      playlists/route.ts               # GET — returns user's saved playlists
      export/route.ts                  # POST — searches tracks, creates playlist, adds tracks

components/
  cursor-trail.tsx                      # CSS mask reveal effect that follows the cursor
  nav.tsx                               # Top navigation bar (Dashboard / Playlists / Sign out)
  dashboard-shell.tsx                   # Main dashboard UI — prompt, tabs, generate, export
  playlists-shell.tsx                   # Playlists grid — shows all user playlists
  recommendations-panel.tsx             # (Legacy) original simple recommendations button

lib/
  config.ts                             # Single source of truth — URLs, credentials, scopes
  session.ts                            # JWT session: create, read, delete (HTTP-only cookie)
  spotify.ts                            # Spotify API helpers — auth, profile, tracks, artists,
                                        #   playlists, create playlist, add tracks, search
  ai.ts                                 # AI recommendation engine — builds prompt from mood +
                                        #   selected tracks/artists, calls GitHub Models API
```

---

## How each piece works

### Authentication (`lib/session.ts` + `lib/spotify.ts`)

The app uses Spotify's **Authorization Code** flow. When a user clicks "Connect with Spotify":

1. `/api/auth/signin/spotify` redirects them to Spotify's authorize page with the required scopes
2. Spotify redirects back to `/api/auth/callback/spotify` with an authorization code
3. The callback exchanges the code for access + refresh tokens
4. It fetches the user's Spotify profile
5. Everything gets packed into a **signed JWT** and stored as an HTTP-only cookie

The session cookie is verified on every protected page load using `jose` (no third-party auth library needed).

**Scopes requested:** `user-read-private`, `user-read-email`, `user-top-read`, `playlist-read-private`, `playlist-modify-public`, `playlist-modify-private`

### AI Recommendations (`lib/ai.ts`)

The AI module uses GitHub's free Models API (OpenAI-compatible endpoint). It builds a natural-language prompt from three optional inputs:

- **Mood** — free-text description of how the user feels
- **Selected tracks** — specific songs they're vibing with
- **Selected artists** — artists they love (including genres)

The system prompt asks the AI to act like a friend who knows music well — recommend 8 songs, mix mainstream with deeper cuts, and give personal reasons for each pick. Temperature is set to 0.85 for creative variety.

### Dashboard (`components/dashboard-shell.tsx`)

The dashboard is a client component that manages all interactive state:

- **On mount:** fetches the user's top tracks and artists in parallel from Spotify
- **Prompt area:** textarea where you describe your mood
- **Tabs:** switch between top tracks and top artists grids
- **Click-to-add:** clicking a track or artist adds it as a "seed" — shown as a colored chip below the prompt, removable with another click
- **Generate:** sends mood + seeds to `/api/ai/recommend`, displays results
- **Export:** creates a Spotify playlist from the recommendations

### Export Flow (`/api/spotify/export`)

When you click "Export to Spotify":

1. The server searches Spotify for each recommended song (by name + artist)
2. It collects the Spotify URIs of found tracks
3. It creates a new private playlist on the user's account
4. It adds all found tracks to the playlist
5. Returns the playlist URL so the user can open it directly

### Playlists Page (`components/playlists-shell.tsx`)

A simple grid view of all the user's Spotify playlists. Each card shows the cover art, name, track count, and owner. Clicking opens the playlist on Spotify. This lets you see playlists you've exported from the app alongside your other playlists.

---

## Running locally

```bash
git clone https://github.com/nikolasimov/spotify-ai-curator
cd spotify-ai-curator
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

> **Note:** Spotify OAuth requires HTTPS redirect URIs. Use the Vercel deployment or set up a local HTTPS proxy for development.

---

## Environment variables

| Variable                 | Description                                                                 |
| ------------------------ | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`    | Public URL of the app (e.g. `https://spotify-ai-curator.vercel.app`)        |
| `SPOTIFY_CLIENT_ID`      | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET`  | From Spotify Developer Dashboard                                            |
| `NEXTAUTH_SECRET`        | Random secret for signing JWT session cookies                               |
| `GITHUB_TOKEN`           | GitHub personal access token for Models API                                 |
| `GITHUB_MODELS_ENDPOINT` | `https://models.github.ai/inference`                                        |

`SPOTIFY_REDIRECT_URI` is auto-derived from `NEXT_PUBLIC_APP_URL` in `lib/config.ts` — you don't need to set it separately.

---

## API routes reference

| Method | Route                        | Description                                    |
| ------ | ---------------------------- | ---------------------------------------------- |
| GET    | `/api/auth/signin/spotify`   | Starts Spotify OAuth flow                      |
| GET    | `/api/auth/callback/spotify` | Handles OAuth callback, creates session        |
| GET    | `/api/auth/signout`          | Clears session, redirects to landing           |
| POST   | `/api/ai/recommend`          | Generates AI recommendations from mood + seeds |
| GET    | `/api/spotify/top-tracks`    | Returns user's top 20 tracks                   |
| GET    | `/api/spotify/top-artists`   | Returns user's top 20 artists                  |
| GET    | `/api/spotify/playlists`     | Returns user's playlists                       |
| POST   | `/api/spotify/export`        | Creates playlist + adds searched tracks        |

---

## Status

- [x] Spotify OAuth login / logout
- [x] JWT session (HTTP-only cookie)
- [x] Glassmorphism UI with cursor reveal effect
- [x] Mood prompt — describe how you're feeling
- [x] Top tracks tab — click to add as AI seeds
- [x] Top artists tab — click to add as AI seeds
- [x] AI recommendations via GitHub Models
- [x] Export recommendations to Spotify as a playlist
- [x] Playlists page — browse your Spotify library
