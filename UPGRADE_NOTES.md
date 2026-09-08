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

---

# v2.1 — "Interactive" release

Data file format is unchanged. Everything below is additive: the Python edition keeps reading the same
`flowboard_data.json`, and the only new persisted values (sidebar/density/collapsed columns) live in the
browser's local storage, not in the shared data file.

## Fixed
- **Tray icon was invisible on Windows.** `main.js` loaded `assets/tray.png`, but the `assets/` folder didn't
  exist, so the tray was created from an empty image — closing the window "hid" the app somewhere you couldn't
  click. `assets/` now ships `tray.png` / `tray@2x.png`, `icon.png` and `icon.ico`; `package.json` bundles it and
  uses `icon.ico` for the installer.
- Dashboard progress rings never animated (they were rendered already at their final value). They now sweep in.
- Deleting a task, checklist item or group used a blocking `confirm()` dialog. Deletes are now instant and
  **undoable** from the toast for 6.5 s — the item goes back to its original position.

## New
- **Search & commands (Ctrl+K).** Finds tasks in every month and year (title, description, sub-tasks), shows
  where they live, and opens them in the detail drawer. Also runs commands: new task, go to a page, jump to
  today, switch month, toggle theme, collapse sidebar, export, rollover, backup. With no query it lists recently
  updated tasks. If nothing matches, Enter creates a task with that title.
- **Calendar page (Alt+4).** Month grid of the current month's tasks by due date. Drag a task to another day to
  reschedule (logged in the task's activity, undoable). An *Unscheduled* tray on the right lists open tasks with
  no date — drag them onto a day, or drop a dated task back into the tray to clear its date. Double-click a day,
  or use its `+`, to add a task due that day. Checklist tasks with due dates appear too (dashed edge; click to
  edit). Overdue tasks show up as a red badge on the Calendar nav item.
- **Quick-add in every column.** "+ Add Task" now opens an inline box. Enter saves; Shift+Enter opens the full
  form with what you typed pre-filled. The title understands `!high` / `!low`, `#label` (creates the label if it
  doesn't exist) and `@today`, `@tomorrow`, `@fri`, `@15` (day of the shown month), `@+3`, `@2026-10-01`.
- **Needs attention** panel on the dashboard: overdue and due-within-7-days items from the board and the
  checklist, sorted by urgency, click to open; plus an open-tasks-by-priority bar. KPI numbers count up.
  Bars in *Tasks / Month* are clickable and the current month is highlighted.
- **Interactive layout**
  - Sidebar collapses to a 64 px rail (`‹` button or Ctrl+B); the rail shows the current month as a button.
  - Any board column can be collapsed to a vertical strip (`‹` in its header or double-click the header).
  - *Compact* / *Comfortable* card density on the board.
  - All three are remembered per machine.
- **Keyboard**: `[` `]` previous/next month, Alt+1–4 pages, `/` focuses board search, `?` opens the shortcut
  sheet (also under Tools). Cards and calendar chips are focusable; visible focus rings for keyboard users.
- **Motion that answers an action** (all disabled under `prefers-reduced-motion`): a task settles with a short
  pulse where you drop it; completing a task fires a small burst from the card; pages cross-fade only when you
  navigate; a task opened from search scrolls into view and flashes.

## Notes for maintainers
- `nav()` now finds sidebar items by `data-page`, so pages can be added without index bookkeeping.
- `toast(msg, type, action, ms)` accepts an action button; `offerUndo(msg, fn)` wraps it.
- `openAdd(colId, {title, priority, date})` accepts presets (used by quick-add, calendar and the palette).
- New card activity strings: "Rescheduled to …", "Due date removed".
- The Python edition doesn't yet have the calendar, palette or quick-add; it will show tasks created by them
  normally.
