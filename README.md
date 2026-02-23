# Spotify Ai Curator Docs

Dockerized Next.js project that connects to Spotify to make playlists and recommend music
This repo is being built as a learning project!

## Current Status

Implemented:

- Next.js scaffolded
- Docker implemented
- Env variable template added
- Next.js configured for standalone Docker runtime

## Tech Stack

- Next.js(App Router, Typescript)
- Docker / Docker Compose(used alpine linux for its faster speed)

## Project Structure (current)

- `app/` – Next.js app
- `Dockerfile` – multi-stage production image
- `docker-compose.yml` – local container orchestration
- `.dockerignore` – Docker build context exclusions
- `.env.example` – required environment variables

### How to run

- install docker for your system (Ubuntu/ Debian)

```bash
sudo apt-get remove -y docker docker-engine docker.io containerd runc
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
```

### Fix non root perms

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Run the project

```bash
cd /home/nikola/Portfolio/spotify-ai-curator
cp .env.example .env
docker compose up --build
```

App URL: `http://localhost:3000`

Stop:

```bash
docker compose down
```
