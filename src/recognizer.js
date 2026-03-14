const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');
const os = require('os');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegStatic);

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, meta) => {
      if (err) reject(err);
      else resolve(meta.format.duration);
    });
  });
}

function extractClip(inputPath, startSec, durationSec, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(startSec)
      .setDuration(durationSec)
      .audioChannels(1)
      .audioFrequency(22050)
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function recognizeClip(clipPath, apiKey) {
  const form = new FormData();
  form.append('api_token', apiKey);
  form.append('audio', fs.createReadStream(clipPath), {
    filename: path.basename(clipPath),
    contentType: 'audio/mpeg',
  });
  form.append('return', 'spotify,apple_music');

  const res = await axios.post('https://api.audd.io/', form, {
    headers: form.getHeaders(),
    timeout: 20000,
  });

  const data = res.data;
  if (data.status === 'success' && data.result) {
    return {
      artist: data.result.artist,
      title: data.result.title,
      spotify: data.result.spotify?.external_urls?.spotify || null,
    };
  }
  return null;
}

function soundcloudSearchUrl(artist, title) {
  return `https://soundcloud.com/search/sounds?q=${encodeURIComponent(`${artist} ${title}`)}`;
}

function spotifySearchUrl(artist, title) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${artist} ${title}`)}`;
}

function youtubeSearchUrl(artist, title) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist} ${title}`)}`;
}

function youtubeMusicSearchUrl(artist, title) {
  return `https://music.youtube.com/search?q=${encodeURIComponent(`${artist} ${title}`)}`;
}

async function recognizeAll(audioPath, apiKey, intervalSec = 60, clipSec = 15, onProgress) {
  const duration = await getDuration(audioPath);
  const samplePoints = [];

  for (let t = 10; t < duration - clipSec; t += intervalSec) {
    samplePoints.push(t);
  }

  const seen = new Map(); // "artist|title" -> track
  const tracks = [];
  const tmpDir = os.tmpdir();

  for (let i = 0; i < samplePoints.length; i++) {
    const start = samplePoints[i];
    const clipPath = path.join(tmpDir, `dj-clip-${Date.now()}-${i}.mp3`);

    try {
      await extractClip(audioPath, start, clipSec, clipPath);
      const result = await recognizeClip(clipPath, apiKey);

      if (result) {
        const key = `${result.artist.toLowerCase()}|${result.title.toLowerCase()}`;
        if (!seen.has(key)) {
          const track = {
            index: tracks.length + 1,
            artist: result.artist,
            title: result.title,
            timestamp: formatTime(start),
            soundcloud: soundcloudSearchUrl(result.artist, result.title),
            spotify: result.spotify || spotifySearchUrl(result.artist, result.title),
            youtube: youtubeSearchUrl(result.artist, result.title),
            youtubeMusic: youtubeMusicSearchUrl(result.artist, result.title),
          };
          seen.set(key, track);
          tracks.push(track);
        }
      }
    } catch (_err) {
      // skip failed clips silently
    } finally {
      if (fs.existsSync(clipPath)) fs.unlinkSync(clipPath);
    }

    if (onProgress) onProgress(i + 1, samplePoints.length, tracks.length);

    // small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  return tracks;
}

module.exports = { recognizeAll };
