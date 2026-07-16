# Bitcrush Linki

Linki is a Chrome extension for bulk-copying links from open tabs. The use case: a user has 30 tabs open, 22 are from Pinterest. They want to save those links somewhere and close the tabs without doing it one at a time. Linki filters by hostname, copies or exports the matching set, and optionally closes those tabs in one action.

## Stack

- React 19.2
- Tailwind 4
- Vite v8.0.10
- TypeScript
- Manifest V3

## Core Mental Model

The filter defines the **working set**. Every action operates on that set.

- Empty filter → working set is every open tab.
- Filter "pinterest" with 22 matches out of 30 → working set is those 22 tabs.

This applies to all four action buttons. Tabs outside the working set are never touched.

The working set is always scoped to the current window, and only ever considers unpinned `http(s)` tabs — pinned tabs are deliberately excluded (bulk-close never touches them), and non-http(s) pages (`chrome://`, extension pages, etc.) are excluded entirely.

## UI Flow

1. User clicks the Linki icon in the browser toolbar.
2. Popup opens with the following components, top to bottom:
   - **Header**: "Linki" left-aligned, "A Bitcrush Tool" as a much smaller subtitle far-right.
   - **Tab count**: "xx Open Tabs" when no filter is active, "X of Y tabs match" whenever a filter is active — even if all tabs match (e.g. "22 of 30 tabs match").
   - **Filter bar**: text input.
   - **Unique Links Only** checkbox, default ON.
   - **Action buttons**:
     - Copy
     - Export
     - Copy & Close
     - Export & Close

## Behaviour

**Filter matching**: case-insensitive substring match against tab **hostname + path** (query strings are excluded). "pinterest" matches `pinterest.com`, `uk.pinterest.com`, `pinterest.co.uk`. Because the path is included, "reddit.com/r/pics" matches tabs open on that subreddit.

**Unique Links Only**: when checked, URLs in the working set are normalised by stripping common tracking parameters before deduplication, and the copied/exported output contains these normalised URLs, not the tabs' original URLs. Strip list:

- `utm_*` (any param starting with `utm_`)
- `fbclid`
- `gclid`
- `ref`
- `ref_src`

When unchecked, every tab's URL is included as-is, no deduplication.

**Copy**: writes the working set to the clipboard. Plain text, newline-separated. If the clipboard write fails, the Copy button shows an error state.

**Export**: downloads the working set as a `.txt` file. Plain text, newline-separated. Filename pattern: `linki-export-YYYY-MM-DD.txt`, where the date is the user's local date.

**Copy & Close** / **Export & Close**: performs the copy or export action, then closes every tab in the working set, then dismisses the popup. Export & Close waits briefly after starting the download before closing tabs, so the download isn't lost when the tabs (and possibly the window) close. If the clipboard write fails, Copy & Close shows an error state and does not close any tabs.

## Design

- **Colour scheme**: Bitcrush Studio palette from `design_tokens.tsx`.
- **Icons**: Lucide React components for in-UI icons. Manifest icons (16/32/48/128 PNGs) generated at build time from a single Lucide SVG source.
- **Styling**: Tailwind for everything.

## Permissions

Manifest V3, minimum surface:

- `tabs` — required to read tab URLs/titles and to close tabs.
- No `host_permissions`. `chrome.tabs.query` reads metadata directly without script injection.

No network access. No telemetry. No data leaves the browser.

## Codebase Rules

1. No docstrings unless absolutely necessary. Comments are minimal and in-line only.
2. All styling via Tailwind. No inline styles.
3. `.tsx` only. No `.jsx`.
4. `design_tokens.tsx` is the source of truth for colour, spacing, and typography.
5. Lucide for in-UI icons. Manifest icons generated as PNGs from Lucide SVGs at build time.
6. ESLint strict — zero errors, zero warnings.
7. Pre-commit hook (Husky + lint-staged): TypeScript compile, ESLint, and no `console.*` calls. Commit blocked on any failure.
8. Commit after each task.

## Distribution

- **Install target**: Chrome Web Store (decided 2026-07-16). Listing copy, permission justifications, and the privacy policy live in `store/`. The privacy policy must be hosted at a public URL before submission; screenshots are taken manually per the checklist in `store/listing.md`.