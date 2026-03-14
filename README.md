# DJ Tracklist Detector

Paste a YouTube DJ set URL → automatically identifies every song → shows **SoundCloud**, **Spotify**, **YouTube** and **YouTube Music** links.

Runs as a local web app in your browser. No account needed beyond a free AudD API key.

![screenshot placeholder](https://placehold.co/860x480/18181f/a259ff?text=DJ+Tracklist+Detector)

---

## Quick Start

### 1 — Install Node.js

| Platform | Command |
|----------|---------|
| Mac      | `brew install node` or [nodejs.org](https://nodejs.org) |
| Windows  | [nodejs.org](https://nodejs.org) installer |

### 2 — Clone & run

```bash
git clone https://github.com/SahaBhaskar/dj-tracklist-detector.git
cd dj-tracklist-detector
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

### 3 — Get a free AudD API key

1. Go to **https://dashboard.audd.io/**
2. Sign up (free tier = 500 recognitions/month)
3. Copy your API token and paste it into the app — it's saved in your browser for next time

---

## How it works

1. You paste a YouTube URL and hit **Detect Songs**
2. The server downloads the audio at low quality via **yt-dlp** (auto-downloaded on first run)
3. **ffmpeg** extracts short clips at regular intervals (default: 15 sec every 60 sec)
4. Each clip is sent to the **AudD** music recognition API
5. Results are deduplicated, timestamped, and streamed back live
6. Links to **SoundCloud**, **Spotify**, **YouTube**, and **YouTube Music** are generated per track

---

## Settings

| Option | Default | Description |
|--------|---------|-------------|
| Sample every | 60 sec | Interval between recognition clips |
| Clip length  | 15 sec | Duration of each clip sent to AudD |

Shorter interval = more API calls, catches more transitions.

---

## API Usage (AudD free tier)

- Free: **500 requests / month**
- A 2-hour mix at 60 s interval ≈ 120 requests
- Upgrade at [dashboard.audd.io](https://dashboard.audd.io/) for more

---

## Stack

- **Backend** — Node.js + Express, yt-dlp, ffmpeg, AudD API
- **Frontend** — Vanilla HTML/CSS/JS, SSE for live progress
