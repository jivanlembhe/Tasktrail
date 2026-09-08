# TaskTrail (formerly FlowBoard Pro) — v2.0 upgrade notes

## Renamed
- App is now **TaskTrail** (Plan · Do · Track). The "Kanban Board" page is now **Task Board**.
- `name`/`appId` in package.json are unchanged so the installer upgrades the existing install in place.
- On first launch, `main.js` copies the old `%APPDATA%\FlowBoard Pro` folder to `%APPDATA%\TaskTrail` if the new one is empty — nothing is lost.

## Data model
- Storage is now per **year**: `db.years[2026|2027|…].kanban / .checklist`. Existing data is upgraded automatically on load (it becomes year 2026). Old backups still restore.
- December → January rolls incomplete tasks into the next year. Switch years with ◀ ▶ in the sidebar.

## New on the Task Board
- Drag to **reorder within a column** (insertion line shows where the card lands) as well as between columns.
- **Custom columns**: ⋯ on any column header to rename / recolour / move; "+ Column" to add. Built-in columns can't be deleted (the dashboard and rollover depend on them).
- **Labels**: manage via "🏷 Labels"; assign in the task form or the detail panel; filter bar with search, priority and label chips.
- **Card detail panel**: click a card → title, column, priority, due date, labels, description, checklist, comments, and an automatic activity log.

## Appearance (sidebar → Tools)
- Body / heading font, text size, text colour, accent, background, card colour, six presets. Saved with your data and in local storage.

## Backup & Restore (sidebar → Tools)
- Choose any backup folder (e.g. OneDrive — detected automatically with a one-click button), reset to default.
- Backup now, list, restore from the folder, or **Restore from file…** (any backup JSON, wherever it lives).
- Automatic backups every 30 minutes and on quit, 30 kept.
