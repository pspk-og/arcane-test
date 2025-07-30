const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Webview operations
  getWebviewUrl: (webContentsId) => ipcRenderer.invoke('get-webview-url', webContentsId),
  
  // Download operations
  downloadManga: (module, url, options) => ipcRenderer.invoke('download-manga', { module, url, options }),
  
  // File system operations
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  openDownloadsFolder: () => ipcRenderer.invoke('open-downloads-folder'),
  
  // Utility functions
  isUrl: (string) => {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }
});

// Expose clipboard API for URL pasting
contextBridge.exposeInMainWorld('clipboardAPI', {
  readText: () => navigator.clipboard.readText(),
  writeText: (text) => navigator.clipboard.writeText(text)
});
