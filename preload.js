const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  detectSongs: (opts) => ipcRenderer.invoke('detect-songs', opts),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  saveTracklist: (text) => ipcRenderer.invoke('save-tracklist', text),
  onProgress: (cb) => {
    ipcRenderer.on('progress', (_event, data) => cb(data));
    return () => ipcRenderer.removeAllListeners('progress');
  },
});
