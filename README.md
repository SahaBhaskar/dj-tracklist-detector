# DJ Tracklist Detector

Paste a YouTube DJ set URL → automatically identifies every song → shows SoundCloud, Spotify & YouTube search links.

## Quick Start

### 1 — Prerequisites

| Tool | Mac | Windows |
|------|-----|---------|
| Node.js | `brew install node` or [nodejs.org](https://nodejs.org) | [nodejs.org](https://nodejs.org) installer |

### 2 — Install & run

**Mac:**
```bash
bash setup.sh
npm start
```

**Windows:**
```powershell
npm install
npm start
```

### 3 — Get a free AudD API key

1. Go to **https://dashboard.audd.io/**
2. Sign up for a free account (500 recognitions/month free)
3. Copy your API token and paste it into the app

---

## How it works

1. Downloads the YouTube audio as a low-quality MP3 (via **yt-dlp**, auto-downloaded on first run)
2. Extracts short clips (default: 15 sec) at regular intervals (default: every 60 sec)
3. Sends each clip to the **AudD** music recognition API
4. Deduplicates results and builds a timestamped tracklist
5. Generates **SoundCloud**, **Spotify** and **YouTube** search links for each track

## Build distributable app

```bash
# macOS .dmg
npm run dist:mac

# Windows .exe installer (run on Windows)
npm run dist:win
```

Output lands in the `dist/` folder.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Sample every | 60 sec | How often to take a clip |
| Clip length | 15 sec | Duration of each recognition clip |

Shorter interval = more API calls but catches more transitions.

## Limits

- AudD free tier: **500 recognitions/month**
- A 2-hour mix at 60 s interval = ~120 API calls
