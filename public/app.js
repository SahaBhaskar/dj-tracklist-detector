/* ── Elements ── */
const urlInput    = document.getElementById('url-input');
const apiKeyInput = document.getElementById('api-key');
const intervalSel = document.getElementById('interval');
const clipDurSel  = document.getElementById('clip-dur');
const detectBtn   = document.getElementById('detect-btn');

const progressPanel = document.getElementById('progress-panel');
const progressBar   = document.getElementById('progress-bar');
const statusText    = document.getElementById('status-text');
const progressCount = document.getElementById('progress-count');
const foundCount    = document.getElementById('found-count');

const errorPanel  = document.getElementById('error-panel');
const errorText   = document.getElementById('error-text');

const resultsPanel = document.getElementById('results-panel');
const resultsTitle = document.getElementById('results-title');
const tracksBody   = document.getElementById('tracks-body');
const noResults    = document.getElementById('no-results');
const copyBtn      = document.getElementById('copy-btn');
const saveBtn      = document.getElementById('save-btn');

/* ── Persist API key ── */
const STORAGE_KEY = 'dj-detector-api-key';
apiKeyInput.value = localStorage.getItem(STORAGE_KEY) || '';
apiKeyInput.addEventListener('change', () =>
  localStorage.setItem(STORAGE_KEY, apiKeyInput.value.trim())
);

/* ── Icons ── */
const ICONS = {
  sc: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M11.56 8.87V17h8.76c1.54-.01 2.68-1.17 2.68-2.57 0-1.34-1.04-2.47-2.35-2.57-.12-2.19-1.95-3.93-4.21-3.93-1.14 0-2.18.43-2.88 1.14-.2-.13-.47-.2-.76-.2zM0 13.45c0 1.99 1.61 3.55 3.56 3.55a3.55 3.55 0 003.55-3.55c0-.42-.09-.82-.23-1.19-.43.1-.88.16-1.34.16C2.36 12.42.55 12.04 0 13.45z"/>
  </svg>`,
  sp: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>`,
  yt: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>`,
  ytm: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white">
    <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L16.2 12l-6.516 3.54z"/>
  </svg>`,
};

/* ── Detect ── */
detectBtn.addEventListener('click', async () => {
  const url    = urlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();

  if (!url)    { alert('Please enter a YouTube URL.'); return; }
  if (!apiKey) { alert('Please enter your AudD API key.\n\nGet a free one at https://dashboard.audd.io/'); return; }
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url)) {
    alert('Please enter a valid YouTube URL.'); return;
  }

  localStorage.setItem(STORAGE_KEY, apiKey);

  // Reset UI
  detectBtn.disabled = true;
  detectBtn.textContent = 'Detecting…';
  progressPanel.hidden = false;
  errorPanel.hidden    = true;
  resultsPanel.hidden  = true;
  progressBar.style.width  = '0%';
  statusText.textContent   = 'Starting…';
  progressCount.textContent = '';
  foundCount.textContent    = '';
  tracksBody.innerHTML = '';

  try {
    const response = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        apiKey,
        intervalSec: Number(intervalSel.value),
        clipSec:     Number(clipDurSel.value),
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    await readSSEStream(response.body);
  } catch (err) {
    showError(err.message);
  } finally {
    detectBtn.disabled = false;
    detectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.5"/>
      <path d="M6 5.5l4 2.5-4 2.5V5.5z" fill="currentColor"/>
    </svg> Detect Songs`;
  }
});

/* ── Stream parser ── */
async function readSSEStream(body) {
  const reader  = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop(); // keep incomplete chunk

    for (const chunk of chunks) {
      const eventMatch = chunk.match(/^event: (.+)$/m);
      const dataMatch  = chunk.match(/^data: (.+)$/m);
      if (!eventMatch || !dataMatch) continue;

      const event = eventMatch[1].trim();
      const data  = JSON.parse(dataMatch[1].trim());
      handleEvent(event, data);
    }
  }
}

function handleEvent(event, data) {
  if (event === 'status') {
    statusText.textContent = data.message;

  } else if (event === 'download') {
    statusText.textContent  = `Downloading audio… ${data.percent.toFixed(0)}%`;
    progressBar.style.width = `${(data.percent * 0.4).toFixed(1)}%`;

  } else if (event === 'recognize') {
    const pct = 40 + (data.done / data.total) * 60;
    progressBar.style.width   = `${pct.toFixed(1)}%`;
    progressCount.textContent = `${data.done} / ${data.total} samples`;
    statusText.textContent    = 'Analyzing audio…';
    if (data.found > 0) {
      foundCount.textContent = `${data.found} track${data.found !== 1 ? 's' : ''} found so far`;
    }

  } else if (event === 'done') {
    progressBar.style.width = '100%';
    statusText.textContent  = 'Done!';
    renderResults(data.tracks);

  } else if (event === 'error') {
    showError(data.message);
  }
}

/* ── Render results ── */
function renderResults(tracks) {
  resultsPanel.hidden = false;
  tracksBody.innerHTML = '';

  if (tracks.length === 0) {
    noResults.hidden   = false;
    resultsTitle.textContent = 'Tracklist — No songs found';
    return;
  }

  noResults.hidden = true;
  resultsTitle.textContent = `Tracklist — ${tracks.length} track${tracks.length !== 1 ? 's' : ''}`;

  tracks.forEach((t) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.index}</td>
      <td>${t.timestamp}</td>
      <td>${esc(t.artist)}</td>
      <td>${esc(t.title)}</td>
      <td>
        <div class="link-icons">
          <a class="link-btn link-sc"  href="${esc(t.soundcloud)}"   target="_blank" rel="noopener" title="SoundCloud">${ICONS.sc}</a>
          <a class="link-btn link-sp"  href="${esc(t.spotify)}"      target="_blank" rel="noopener" title="Spotify">${ICONS.sp}</a>
          <a class="link-btn link-yt"  href="${esc(t.youtube)}"      target="_blank" rel="noopener" title="YouTube">${ICONS.yt}</a>
          <a class="link-btn link-ytm" href="${esc(t.youtubeMusic)}" target="_blank" rel="noopener" title="YouTube Music">${ICONS.ytm}</a>
        </div>
      </td>`;
    tracksBody.appendChild(tr);
  });
}

/* ── Error ── */
function showError(msg) {
  errorPanel.hidden = false;
  errorText.textContent = `Error: ${msg}`;
  progressPanel.hidden = true;
}

/* ── Copy / Save ── */
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(buildText());
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
});

saveBtn.addEventListener('click', () => {
  const blob = new Blob([buildText()], { type: 'text/plain' });
  const a = Object.assign(document.createElement('a'), {
    href:     URL.createObjectURL(blob),
    download: 'tracklist.txt',
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

function buildText() {
  const rows  = tracksBody.querySelectorAll('tr');
  const lines = ['DJ Set Tracklist\n================\n'];
  rows.forEach((row) => {
    const cells  = row.querySelectorAll('td');
    if (cells.length < 4) return;
    const num    = cells[0].textContent.trim();
    const time   = cells[1].textContent.trim();
    const artist = cells[2].textContent.trim();
    const title  = cells[3].textContent.trim();
    const scUrl  = row.querySelector('.link-sc')?.href  || '';
    const spUrl  = row.querySelector('.link-sp')?.href  || '';
    const ytmUrl = row.querySelector('.link-ytm')?.href || '';
    lines.push(`${num}. [${time}] ${artist} - ${title}`);
    lines.push(`   SoundCloud:    ${scUrl}`);
    lines.push(`   Spotify:       ${spUrl}`);
    lines.push(`   YouTube Music: ${ytmUrl}`);
    lines.push('');
  });
  return lines.join('\n');
}

function esc(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
