# TaskTrail — Python edition (PySide6)

Same app as the Electron TaskTrail, written in Python. **Same data file, same format,
same backups** — you can run either version against the same data:

- Windows: `%APPDATA%\TaskTrail\flowboard_data.json`  ·  backups in `%APPDATA%\TaskTrail\backups`
  (or the folder you choose, e.g. OneDrive)
- Old FlowBoard / TaskTrail v1 files (flat "kanban/checklist" format) are upgraded automatically on first load.

## Run from source
```
pip install -r requirements.txt
python tasktrail.py
```
Python 3.9+ on Windows, macOS or Linux.

## Build a Windows .exe
Double-click `build_win.bat` (or run it in a terminal). It produces `dist\TaskTrail.exe`
(single file, ~45 MB, no console window). The exe is unsigned, so SmartScreen shows the
"unknown publisher" prompt once — choose *More info → Run anyway*.

## Features
- Dashboard (KPIs, overdue count, recent activity, tasks-per-month chart)
- Task Board: drag to reorder within a column or move between columns; custom columns
  (⋯ to rename/recolour/move, "+ Column" to add); labels with a filter bar (search, priority, labels)
- Card detail panel (click a card): column, priority, due date, labels, description,
  checklist, comments, activity log
- Task Checklist page with groups, sub-tasks, priority and due dates
- Month grid + year switcher (◀ ▶); auto-rollover of unfinished tasks at month end,
  December → January of the next year; manual rollover panel with history
- Backup & Restore: choose any folder (one-click OneDrive), backup now, restore from list
  or from any file; automatic backup every 30 min and on quit; 30 kept
- Excel export (openpyxl): board sheets, checklist sheets, month-wise summary
- Appearance: font family & size, text/accent/background/card colours, dark/light, six presets
- System tray: closing the window hides to the tray; right-click the tray icon → Quit
  (closing twice within 3 s also quits). Ctrl+N new task · Ctrl+Shift+B backup now.

## Files
- `tasktrail.py` — the whole app (single file)
- `requirements.txt`, `build_win.bat`
