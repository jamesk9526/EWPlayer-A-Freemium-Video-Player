Goals

Get to a video (or a set of videos) in 1–2 clicks.

Keep the player focused; push management tasks to drawers/menus.

Make batch work (tag, move, delete) painless.

Be great with mouse, keyboard, and touch.

Information architecture

Global header

App logo + quick upload

Command/Search (type-to-filter with keyboard shortcuts)

View toggle (Grid / List / Compact)

Sort menu (Recent, Added date, Duration, Name, Most played)

“Saved views” dropdown (e.g., All 1080p, Recently Added, Needs Tags)

Left rail (collapsible)

Library

All videos

Favorites ★

Watch Later

Recently Added / Recently Played

Playlists & Collections

Folders (source locations)

Trash

Filters (faceted)

Duration (short/med/long) slider

Resolution (4K/1080/720), FPS, Aspect

Type (mp4, mov), Orientation

Tags (multi-select)

Has captions / chapters / notes

Source (import feed, camera, folder)

Main content

Virtualized Grid or List of cards

Sticky Bulk toolbar appears when items are selected

Pagination/infinite scroll with clear count: “214 results”

Right rail (context drawer)

Tabs: Details | Chapters | Transcript | Versions

Shows metadata for the current selection or hovered item

Remains available in both Library and Player

Library layout & card design

Card (16:9, responsive)

Thumbnail with hover-scrub preview

Top-left: file-type chip (MP4) only on hover; keep always-on minimal

Bottom gradient with:

Title (editable inline on click)

Duration • Resolution • FPS

Progress bar (watched %) on bottom edge

Quick actions (appear on hover; never as big primary buttons):

▶ Play • ♥ Favorite • ⠇ More (context menu)

Context menu (right-click or ⠇):

Add to queue / playlist

Rename

Edit metadata (opens right drawer)

Show in folder

Replace source / Re-upload

Download

Delete (with confirm)

Selection mode: checkmark in top-right corner (Shift-click range select)

List view

Compact rows with leading thumbnail, title, duration, date added, tags, watched %, and kebab menu. Columns are configurable and sticky-header sortable.

Empty & error states

Dropzone for drag-and-drop upload with recent folders

Clear messaging for “No results. Try removing filters.”

Player layout (Theater-first)

Top

Collapsible global header (auto-hide when playing)

Breadcrumb: Library › Playlist/Collection › Video

Main

Video area centered, responsive “theater” width

Transport controls:

Play/Pause, Time, Seek bar with chapter markers and thumbnail previews

Volume, Speed, Captions/Audio tracks, Loop segment, PiP, Theater, Fullscreen

Right sidebar (Queue) — collapsible:

“Up Next” (drag to reorder)

Queue controls: Shuffle, Repeat one/all, Clear, Save as playlist

Search to add more videos without leaving the player

Below the player

Title (editable), Favorite, Tags

Primary actions: Add to playlist, Share link, Download (if allowed)

Secondary: Show in folder, Replace file, View stats (bitrate, codec, resolution)

Tabs: Description | Chapters | Transcript (searchable, click-to-seek) | Notes

Comment/Annotations (optional, private notes per video)

Keyboard shortcuts

Space: play/pause • J/K/L: -10s / pause / +10s

←/→: ±5s • ↑/↓: volume • M: mute • F: fullscreen

T: theater • C: captions • ,/. : frame step (paused)

N/P: next/previous in queue • /: focus search

Mini-player

When navigating the library mid-playback, a dockable mini-player sticks to the bottom so playback never stops.

Batch work & power features

Bulk toolbar (appears on select): Add to playlist • Tag • Move • Delete • Export CSV

“Select all in results” (affects all pages)

Smart collections (auto-updating saved queries): e.g., “Unwatched 4K under 10 min”

Jobs & notifications tray: background imports, transcodes, caption generation progress

Metadata templates (apply common tags/fields to many files)

Accessibility & polish

Real focus states, full keyboard navigation, ARIA roles

Caption styling (font size, background), high-contrast theme toggle

Motion-reduced mode (no hover auto-scrub if “prefers-reduced-motion”)

Tooltips with delays; all icons have labels

Virtualized lists for large libraries; prefetch hovered thumbnails

Consistent spacing (8pt system), 12–14px paddings, 12–16px radius on cards

Quick wins vs. your current screens

Replace big “Play/Show in folder/Delete” buttons on each card with a subtle hover toolbar + kebab menu to reduce visual noise.

Move “Up Next” into a collapsible right Queue with drag-and-drop and “Save as playlist”.

Add hover-scrub + watched progress to card thumbnails.

Introduce faceted filters in a left rail instead of hiding power search in the header only.

Use a details drawer (right rail) for metadata/chapter editing so you don’t navigate away.

Keep a mini-player when leaving the Player page to browse.

Replace bottom “Previous/Next” buttons with keyboard shortcuts and Queue controls.

Promote Rename and Add to playlist to first-class actions; demote “Show in folder”.

Suggested layout grid (high level)

App shell: CSS Grid – grid-template-columns: [rail] 260px [content] 1fr [context] 360px;

Collapsed rails at ≤ 1200px, “context” becomes a drawer.

Player uses a variant: grid-template-columns: 1fr 360px with the header floating.

“Definition of Done” checklist

 Library supports grid/list/compact with saved views

 Faceted filters + tags + quick search work together

 Cards: hover-scrub, watched bar, kebab menu, inline rename

 Bulk selection with sticky toolbar

 Player: chapters on scrub bar, transcript search, captions menu

 Queue: draggable, shuffle/repeat, save as playlist

 Mini-player persists across navigation

 Keyboard shortcuts + help overlay (“?”)

 Accessible focus order, ARIA, caption styling

 Virtualized lists for 1k+ items, smooth scrolling