const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Overlay-specific APIs
  toggleWindowVisibility: () => ipcRenderer.invoke('toggle-window-visibility'),
  
  // Listen for menu events
  onMenuNew: (callback) => ipcRenderer.on('menu-new', callback),
  onClickThroughToggled: (callback) => ipcRenderer.on('click-through-toggled', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
}); 