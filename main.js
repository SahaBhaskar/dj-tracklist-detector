const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f0f13',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC: open external links safely
ipcMain.handle('open-url', async (_event, url) => {
  if (/^https?:\/\//.test(url)) {
    await shell.openExternal(url);
  }
});

// IPC: save tracklist to file
ipcMain.handle('save-tracklist', async (_event, text) => {
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Save Tracklist',
    defaultPath: path.join(os.homedir(), 'tracklist.txt'),
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });
  if (filePath) {
    fs.writeFileSync(filePath, text, 'utf8');
    return true;
  }
  return false;
});

// IPC: main detection pipeline
ipcMain.handle('detect-songs', async (_event, { url, apiKey, intervalSec, clipSec }) => {
  const { downloadAudio } = require('./src/downloader');
  const { recognizeAll } = require('./src/recognizer');

  const send = (type, payload) => mainWindow.webContents.send('progress', { type, ...payload });

  let audioPath = null;
  try {
    send('status', { message: 'Downloading audio...' });

    audioPath = await downloadAudio(url, (percent) => {
      send('download', { percent });
    });

    send('status', { message: 'Analyzing audio...' });

    const tracks = await recognizeAll(audioPath, apiKey, intervalSec, clipSec, (done, total, found) => {
      send('recognize', { done, total, found });
    });

    return { success: true, tracks };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  }
});
