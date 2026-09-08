# TaskTrail

Task planner, to-do list and status tracker for Windows — dashboard, drag-and-drop task board, checklists, calendar with drag-to-reschedule, Ctrl+K search across every month, Excel export, automatic monthly rollover and backups. Two editions that share the same data file
(`%APPDATA%\TaskTrail\flowboard_data.json`):

| Edition | Folder | Build |
|---|---|---|
| Electron (HTML/JS) | repo root — `main.js`, `src/` | `npm install && npm run build` → `dist/` |
| Python (PySide6)   | `python/`                     | `python/build_win.bat` → `python/dist/TaskTrail.exe` + installer |

GitHub Actions builds both automatically: see `.github/workflows/`.
Download the latest installers from the **Actions** tab (artifacts) or from **Releases** (tags `v*` for Electron, `py-v*` for Python).

## Keyboard
`Ctrl K` search & commands · `Ctrl N` new task · `Ctrl B` collapse sidebar · `[` `]` change month · `Alt 1–4` pages · `?` all shortcuts

Quick-add in any column: `Renew SSL !high #ops @fri` sets priority, label and due date from the title.

See `UPGRADE_NOTES.md` for what changed in each release.
