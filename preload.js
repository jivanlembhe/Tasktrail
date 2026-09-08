const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('FlowAPI', {
  dbRead:            ()           => ipcRenderer.invoke('db-read'),
  dbWrite:           (data)       => ipcRenderer.invoke('db-write', data),
  backupNow:         ()           => ipcRenderer.invoke('backup-now'),
  backupList:        ()           => ipcRenderer.invoke('backup-list'),
  backupRestore:     (name)       => ipcRenderer.invoke('backup-restore', name),
  backupRestoreFile: ()           => ipcRenderer.invoke('backup-restore-file'),
  backupGetDir:      ()           => ipcRenderer.invoke('backup-get-dir'),
  backupChooseDir:   ()           => ipcRenderer.invoke('backup-choose-dir'),
  backupSetDir:      (dir)        => ipcRenderer.invoke('backup-set-dir', dir),
  exportPath:        (name)       => ipcRenderer.invoke('export-path', name),
  writeFile:         (path, b64)  => ipcRenderer.invoke('write-file', path, b64),
  appInfo:           ()           => ipcRenderer.invoke('app-info'),
  openPath:          (p)          => ipcRenderer.invoke('open-path', p),
});
