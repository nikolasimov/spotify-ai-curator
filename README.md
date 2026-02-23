# Spotify AI Curator

> A Next.js app that connects to Spotify to generate AI-powered playlist recommendations.
> Built as a portfolio/learning project.

🔗 **Live demo:** [spotify-ai-curator.vercel.app](https://spotify-ai-curator.vercel.app)

---

## What it does

- Connects to your Spotify account via OAuth 2.0
- Reads your top tracks and listening history
- Uses GitHub Models (free AI tokens) to suggest new music and generate playlists
- Creates playlists directly in your Spotify library

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Auth | Spotify OAuth 2.0 + JWT cookies (jose) |
| AI | GitHub Models API (free inference tokens) |
| Hosting | Vercel |

---

## Why Vercel instead of Docker

The project started with a full Docker + Docker Compose setup (multi-stage Dockerfile, alpine linux, standalone Next.js output). That worked fine locally, but Spotify's OAuth requires an **HTTPS redirect URI** — even in development. Getting a trusted TLS certificate for a local Docker container meant setting up a reverse proxy (Caddy/nginx), a tunnel (ngrok/Cloudflare), or a custom domain with cert management. All of that overhead for a portfolio project that doesn't need a self-hosted server.

Vercel solves this for free: automatic HTTPS, instant deploys on every push, and zero infra to maintain. The Docker files were scrapped in favour of deploying directly to Vercel.

---

## Project Structure

```
app/
  page.tsx                        # Homepage (glassmorphism UI, cursor reveal)
  layout.tsx                      # Root layout + fonts
  globals.css                     # Dark theme, radial gradient background
  dashboard/
    page.tsx                      # Authenticated user dashboard
  api/auth/
    signin/spotify/route.ts       # Initiates Spotify OAuth flow
    callback/spotify/route.ts     # Handles OAuth callback, creates session
    signout/route.ts              # Clears session, redirects home
components/
  cursor-trail.tsx                # CSS mask reveal effect on cursor
lib/
  config.ts                       # Single source of truth for URLs + credentials
  session.ts                      # JWT session management (HTTP-only cookie)
  spotify.ts                      # Spotify API helpers (token exchange, profile)
```

---

## Running locally

```bash
git clone https://github.com/nikolasimov/spotify-ai-curator
cd spotify-ai-curator
npm install
cp .env.example .env   # fill in your credentials
npm run dev
```

> **Note:** Spotify OAuth will not work on `http://localhost` — use the Vercel deployment or set up a local HTTPS proxy.

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (e.g. `https://spotify-ai-curator.vercel.app`) |
| `SPOTIFY_CLIENT_ID` | From [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Developer Dashboard |
| `NEXTAUTH_SECRET` | Random secret for signing JWT session cookies |
| `GITHUB_TOKEN` | GitHub personal access token for Models API |
| `GITHUB_MODELS_ENDPOINT` | `https://models.github.ai/inference` |

---

## Current Status

- [x] Spotify OAuth login / logout
- [x] JWT session (HTTP-only cookie)
- [x] User dashboard with profile info
- [x] Glassmorphism UI with cursor reveal effect
- [ ] AI track recommendations via GitHub Models
- [ ] Playlist creation endpoint
- [ ] Top artists / genres analysis
