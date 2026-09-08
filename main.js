const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell, nativeImage } = require('electron');
const path  = require('path');
const fs    = require('fs');
const os    = require('os');

/* ── One-time data-folder migration ─────────────────────────────────────────
   Electron stores user data under %APPDATA%\<productName>. The app used to be
   called "FlowBoard Pro"; if that folder exists and the new one has no data
   yet, copy everything across (JSON db, backups, localStorage) so nothing is
   lost after the rename. */
const LEGACY_NAMES = ['FlowBoard Pro', 'flowboard-pro'];
(function migrateLegacyUserData() {
  try {
    const cur = app.getPath('userData');
    if (fs.existsSync(path.join(cur, 'flowboard_data.json'))) return;   // already has data
    const appData = app.getPath('appData');
    for (const name of LEGACY_NAMES) {
      const old = path.join(appData, name);
      if (old !== cur && fs.existsSync(old)) {
        fs.cpSync(old, cur, { recursive: true, force: false, errorOnExist: false });
        fs.writeFileSync(path.join(cur, 'migrated_from.txt'), old);
        return;
      }
    }
  } catch (e) { console.error('legacy migration failed', e); }
})();

const USER_DATA     = app.getPath('userData');
const DB_FILE       = path.join(USER_DATA, 'flowboard_data.json');
const SETTINGS_FILE = path.join(USER_DATA, 'settings.json');
const LOG_FILE      = path.join(USER_DATA, 'app.log');
const DEFAULT_BACKUP_DIR = path.join(USER_DATA, 'backups');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch (e) {}
  console.log(msg);
}

/* ── Settings (backup location) ──────────────────────────────────────────── */
function readSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch (e) { return {}; }
}
function writeSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2), 'utf8');
}
function getBackupDir() {
  const s = readSettings();
  const dir = (s.backupDir && typeof s.backupDir === 'string') ? s.backupDir : DEFAULT_BACKUP_DIR;
  try { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); } catch (e) {
    log(`Backup dir unavailable (${dir}): ${e.message} — falling back to default`);
    if (!fs.existsSync(DEFAULT_BACKUP_DIR)) fs.mkdirSync(DEFAULT_BACKUP_DIR, { recursive: true });
    return DEFAULT_BACKUP_DIR;
  }
  return dir;
}
// Detect a OneDrive folder on this machine (Windows sets these env vars)
function detectOneDrive() {
  const candidates = [process.env.OneDriveCommercial, process.env.OneDriveConsumer, process.env.OneDrive,
                      path.join(os.homedir(), 'OneDrive')];
  return candidates.find(p => p && fs.existsSync(p)) || null;
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let mainWindow = null;
let tray       = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1400,
    height: 880,
    minWidth:  900,
    minHeight: 600,
    title: app.name,
    backgroundColor: '#07080d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    frame: true,
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => { mainWindow.show(); log('Window shown'); });

  // Closing the window hides TaskTrail to the tray. A second close request
  // within 3 s (e.g. from an installer/updater or a double Alt+F4) quits for real.
  let lastCloseAt = 0;
  mainWindow.on('close', (e) => {
    if (app.isQuiting) return;
    const now = Date.now();
    if (now - lastCloseAt < 3000) { app.isQuiting = true; return; }
    lastCloseAt = now;
    e.preventDefault(); mainWindow.hide();
    if (tray && !app.trayHintShown) {
      app.trayHintShown = true;
      try { tray.displayBalloon({ title: app.name, content: 'Still running in the system tray. Right-click the tray icon and choose Quit to exit.', iconType: 'info' }); } catch (_) {}
    }
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray.png');
  const img = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(img);
  tray.setToolTip(app.name);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `Open ${app.name}`,  click: showWindow },
    { type: 'separator' },
    { label: 'Backup Data Now',   click: () => backupNow(false) },
    { label: 'Open Backup Folder',click: () => shell.openPath(getBackupDir()) },
    { label: 'Open Data Folder',  click: () => shell.openPath(USER_DATA)  },
    { type: 'separator' },
    { label: 'Quit',              click: quitApp   },
  ]));
  tray.on('double-click', showWindow);
}

function showWindow() {
  if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  else createWindow();
}

function quitApp() { app.isQuiting = true; app.quit(); }

function backupNow(silent = false) {
  if (!fs.existsSync(DB_FILE)) return null;
  const dir  = getBackupDir();
  const ts   = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dest = path.join(dir, `flowboard_backup_${ts}.json`);
  try {
    fs.copyFileSync(DB_FILE, dest);
  } catch (e) {
    log(`Backup failed: ${e.message}`);
    if (!silent) dialog.showMessageBox(mainWindow, { type: 'error', title: 'Backup failed', message: e.message });
    return null;
  }
  log(`Backup created: ${dest}`);
  pruneBackups(dir);
  if (!silent) {
    dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Backup Complete',
      message: `✅ Backup saved!\n\n📁 ${dest}`,
      buttons: ['Open Folder', 'OK'],
    }).then(r => { if (r.response === 0) shell.openPath(dir); });
  }
  return dest;
}

function pruneBackups(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('flowboard_backup_') && f.endsWith('.json'))
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  files.slice(30).forEach(({ f }) => { try { fs.unlinkSync(path.join(dir, f)); } catch (e) {} });
}

function scheduleBackup() {
  setInterval(() => backupNow(true), 30 * 60 * 1000);
}

function writeDb(data) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
  fs.renameSync(tmp, DB_FILE);          // atomic on the same volume
  return true;
}

/* ── IPC ─────────────────────────────────────────────────────────────────── */
ipcMain.handle('db-read',  ()         => fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : null);
ipcMain.handle('db-write', (_, data)  => writeDb(data));
ipcMain.handle('backup-now', ()       => backupNow(false));
ipcMain.handle('backup-list', () => {
  const dir = getBackupDir();
  return fs.readdirSync(dir).filter(f => f.endsWith('.json'))
    .map(f => { const s = fs.statSync(path.join(dir, f)); return { name: f, size: s.size, mtime: s.mtime }; })
    .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
});
ipcMain.handle('backup-restore', async (_, name) => {
  const src = path.join(getBackupDir(), path.basename(name));
  if (!fs.existsSync(src)) return false;
  const res = await dialog.showMessageBox(mainWindow, {
    type: 'warning', title: 'Restore Backup',
    message: `Restore from:\n${name}\n\nThis will overwrite current data. Continue?`,
    buttons: ['Restore', 'Cancel'], defaultId: 1,
  });
  if (res.response === 0) { backupNow(true); fs.copyFileSync(src, DB_FILE); return true; }
  return false;
});
// Restore from any JSON file the user picks (e.g. a backup kept in OneDrive)
ipcMain.handle('backup-restore-file', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Restore from backup file', defaultPath: getBackupDir(),
    filters: [{ name: 'Backup JSON', extensions: ['json'] }], properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const file = res.filePaths[0];
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return { error: 'That file is not valid JSON.' }; }
  if (!parsed || (!parsed.kanban && !parsed.years)) return { error: 'That file is not a TaskTrail / FlowBoard backup.' };
  const confirm = await dialog.showMessageBox(mainWindow, {
    type: 'warning', title: 'Restore Backup',
    message: `Restore from:\n${file}\n\nThis will overwrite current data. Continue?`,
    buttons: ['Restore', 'Cancel'], defaultId: 1,
  });
  if (confirm.response !== 0) return null;
  backupNow(true);
  fs.copyFileSync(file, DB_FILE);
  return { file };
});
// Backup location
ipcMain.handle('backup-get-dir', () => ({
  dir: getBackupDir(), isDefault: getBackupDir() === DEFAULT_BACKUP_DIR,
  defaultDir: DEFAULT_BACKUP_DIR, oneDrive: detectOneDrive(),
}));
ipcMain.handle('backup-choose-dir', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose backup folder', defaultPath: getBackupDir(),
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths.length) return null;
  const s = readSettings(); s.backupDir = res.filePaths[0]; writeSettings(s);
  log(`Backup dir set to ${s.backupDir}`);
  return getBackupDir();
});
ipcMain.handle('backup-set-dir', (_, dir) => {
  const s = readSettings();
  if (dir) { s.backupDir = dir; } else { delete s.backupDir; }
  writeSettings(s);
  return getBackupDir();
});
ipcMain.handle('export-path', async (_, defaultName) => {
  const res = await dialog.showSaveDialog(mainWindow, {
    title: 'Export Excel', defaultPath: path.join(os.homedir(), 'Desktop', defaultName),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  });
  return res.filePath || null;
});
ipcMain.handle('write-file', (_, filePath, base64Data) => {
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  shell.showItemInFolder(filePath);
  return true;
});
ipcMain.handle('app-info', () => ({
  name: app.name, version: app.getVersion(), userData: USER_DATA, backupDir: getBackupDir(),
  dbFile: DB_FILE, platform: process.platform, electron: process.versions.electron,
}));
ipcMain.handle('open-path', (_, p) => shell.openPath(p));

app.whenReady().then(() => {
  log(`${app.name} starting`);
  createWindow();
  createTray();
  scheduleBackup();
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'File', submenu: [
      { label: 'Backup Now', accelerator: 'Ctrl+Shift+B', click: () => backupNow() },
      { label: 'Open Backup Folder', click: () => shell.openPath(getBackupDir()) },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Ctrl+Q', click: quitApp },
    ]},
    { label: 'Edit', submenu: [
      { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
      { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
    ]},
    { label: 'View', submenu: [
      { role: 'reload' }, { role: 'forceReload' }, { type: 'separator' },
      { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
      { type: 'separator' }, { role: 'togglefullscreen' },
      { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
    ]},
  ]));
});

app.on('second-instance', () => showWindow());
app.on('window-all-closed', () => {});
app.on('before-quit', () => backupNow(true));
