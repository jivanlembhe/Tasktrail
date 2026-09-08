# TaskTrail

Task planner, to-do list and status tracker for Windows. Two editions that share the same data file
(`%APPDATA%\TaskTrail\flowboard_data.json`):

| Edition | Folder | Build |
|---|---|---|
| Electron (HTML/JS) | repo root — `main.js`, `src/` | `npm install && npm run build` → `dist/` |
| Python (PySide6)   | `python/`                     | `python/build_win.bat` → `python/dist/TaskTrail.exe` + installer |

GitHub Actions builds both automatically: see `.github/workflows/`.
Download the latest installers from the **Actions** tab (artifacts) or from **Releases** (tags `v*` for Electron, `py-v*` for Python).
