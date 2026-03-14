const express = require('express');
const path    = require('path');
const fs      = require('fs');

const { downloadAudio } = require('./src/downloader');
const { recognizeAll }  = require('./src/recognizer');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── POST /api/detect — streams SSE progress then final result ── */
app.post('/api/detect', async (req, res) => {
  const { url, apiKey, intervalSec = 60, clipSec = 15 } = req.body;

  if (!url || !apiKey) {
    return res.status(400).json({ error: 'url and apiKey are required' });
  }

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const send = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let audioPath = null;
  try {
    send('status', { message: 'Downloading audio…' });

    audioPath = await downloadAudio(url, (percent) => {
      send('download', { percent });
    });

    send('status', { message: 'Analyzing audio…' });

    const tracks = await recognizeAll(
      audioPath,
      apiKey,
      Number(intervalSec),
      Number(clipSec),
      (done, total, found) => send('recognize', { done, total, found }),
    );

    send('done', { tracks });
  } catch (err) {
    send('error', { message: err.message });
  } finally {
    if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DJ Tracklist Detector → http://localhost:${PORT}`);
});
