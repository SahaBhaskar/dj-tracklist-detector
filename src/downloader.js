const YTDlpWrap = require('yt-dlp-wrap').default;
const path = require('path');
const os = require('os');
const fs = require('fs');

function getBinPath() {
  const dir = path.join(os.homedir(), '.dj-detector');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const name = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  return path.join(dir, name);
}

async function ensureYtDlp() {
  const binPath = getBinPath();
  if (!fs.existsSync(binPath)) {
    await YTDlpWrap.downloadFromGithub(binPath);
    if (process.platform !== 'win32') {
      fs.chmodSync(binPath, 0o755);
    }
  }
  return binPath;
}

async function downloadAudio(url, onProgress) {
  const binPath = await ensureYtDlp();
  const ytDlp = new YTDlpWrap(binPath);

  const outputPath = path.join(os.tmpdir(), `dj-set-${Date.now()}.mp3`);

  await new Promise((resolve, reject) => {
    const args = [
      url,
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '5',
      '-o', outputPath,
      '--no-playlist',
      '--no-warnings',
    ];

    const proc = ytDlp.execStream(args);

    proc.on('ytDlpEvent', (eventType, eventData) => {
      if (eventType === 'download' && onProgress) {
        const match = eventData.match(/(\d+\.?\d*)%/);
        if (match) onProgress(parseFloat(match[1]));
      }
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited with code ${code}`));
    });
  });

  return outputPath;
}

module.exports = { downloadAudio };
