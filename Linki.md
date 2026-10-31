# Bitcrush Linki

Linki is a Chrome extension for bulk-copying links from open tabs. The use case: a user has 30 tabs open, 22 are from Pinterest. They want to save those links somewhere and close the tabs without doing it one at a time. Linki filters by hostname, copies or exports the matching set, and optionally closes those tabs in one action.

Images mode extends the same idea to the pictures on those pages: scan the working set, get one list of direct image URLs at the best resolution available, bounded by size and type filters. It exists for pages where you can't just right-click and save (Instagram and friends), where the image URL is in the page's JavaScript rather than behind the pixels you see.

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

In Images mode the working set is what gets scanned, the action buttons operate on the **image URLs that came out of the scan** (after the live filters), and the "& Close" variants still close the working set's tabs.

The working set is always scoped to the current window, and only ever considers unpinned `http(s)` tabs — pinned tabs are deliberately excluded (bulk-close never touches them), and non-http(s) pages (`chrome://`, extension pages, etc.) are excluded entirely.

## UI Flow

1. User clicks the Linki icon in the browser toolbar.
2. Popup opens with the following components, top to bottom:
   - **Header**: "Linki" left-aligned, "A Bitcrush Tool" as a much smaller subtitle far-right.
   - **Mode switch**: segmented control, "Links" | "Images". Default Links. Switching never discards scan results.
   - **Tab count**: "xx Open Tabs" when no filter is active, "X of Y tabs match" whenever a filter is active — even if all tabs match (e.g. "22 of 30 tabs match").
   - **Filter bar**: text input. Shared by both modes; it always defines the working set.
   - **Links mode only**: **Unique Links Only** checkbox, default ON.
   - **Images mode only**:
     - **Options row**: "Min size [512] px²", then checkboxes "Skip SVG" (ON), "Skip GIF" (OFF), "Try higher-res URLs" (ON). The minimum is a single number in square pixels: an image passes when √(width × height) ≥ N, whatever its aspect ratio, because datasets are sized that way. 0 disables it.
     - **Scan button**: full-width, emphasised. "Scan N tabs for images" → "Scanning tab 3 of 22…" → "Checking sizes 48 of 180…" → "Rescan N tabs".
     - **Result lines** (mono): "143 images · 22 tabs scanned", then "Skipped: 2,437 under 512 px² · 180 icons · 12 SVG · 3 unverified size", then any warnings in amber (tabs blocked, tabs unloaded, tabs changed since scan, min size lowered since scan).
   - **Action buttons** (both modes):
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

### Images mode

**Scan** is explicit (a button), never automatic: it injects into pages and makes network requests, so it should only happen when asked. On click, Linki requests host access for every origin in the working set other than the active tab (which `activeTab` already covers), then scans. Chrome may close the popup to show that permission prompt; if so, reopening and clicking Scan again proceeds without a prompt. Declining still scans the active tab and reports the rest as blocked.

**Collection** runs inside each tab (`src/popup/lib/images/collect.ts`, injected with `chrome.scripting.executeScript`, main frame plus any frames it can reach, open shadow roots included). Sources, in order:

- `<img>`: `currentSrc` with its real pixel size (the browser's `naturalWidth` is divided by the chosen `srcset` candidate's density, so Linki undoes that), the `src` attribute, every `srcset` and `<picture><source>` candidate with its declared width, every `data-*` attribute that holds an image URL (lazy loaders), and the wrapping `<a href>` or its `data-*` attributes when they point at an image (lightboxes).
- Direct image links, `<video poster>`, and CSS `background-image` / `image-set()` on any element.
- `og:image`, `twitter:image`, `link[rel=image_src]`, `link[rel=preload][as=image]`.
- Inline `<script>`, `<noscript>` and `<template>` text: JSON `{width, height, url}` / `{src, config_width}` triples (Instagram's `display_resources` and `image_versions2`), then any escaped (`\/`, `\u0026`) image-looking URL.

`data:` and `blob:` URLs are ignored; a copied list of those is useless.

**Grouping** (`resolve.ts`): URLs that came from the same element, or that share a key once size tokens are stripped (`url.ts`), are one picture. Each group ends up as a single URL in the output.

**Pruning before probing** (`resolve.ts`): probing is the slow part of a scan, and a page like an Instagram post carries hundreds of pictures that are never wanted (commenter avatars, suggested posts, UI sprites). So before anything is probed:

- **The page's own sizes are trusted.** A variant whose width and height the page declared (Instagram's `image_versions2` triples, srcset descriptors with a measured `<img>`) counts as known, exactly like a measured `<img>`. The biggest known variant is the group's answer unless something of unknown size could beat it.
- **Known-small pictures are dropped.** With a minimum set, a group whose every variant is known or hinted to be under it is skipped and counted under "under N px²". A width-only hint can't bound the area, so a picture is only written off when even a 3:1 portrait at that width would fall short. A group with a higher-res guess still gets that guess probed, unless its best known width is under 160 px — avatars, icons and emoji are never worth upgrading.
- **UI assets are dropped.** Favicons, `.ico`, sprites, emoji, spinners, spacer pixels and Facebook/Instagram `rsrc.php` static files, counted as "icons".
- **Each picture is probed once.** A picture that appears in several tabs (the logged-in user's avatar, a shared header image) is probed in the first tab only; the others reuse the result.
- **Probing is capped at 150 pictures per tab**, biggest hints first and unknown-size pictures ahead of everything (they are usually the main content). Pictures past the cap are settled from what the page declared.
- **Dead hosts stop being guessed.** Once six higher-res guesses against one host (by registrable domain, so sharded CDN hostnames count together) have all failed, no more guesses go to that host for the rest of the scan. Signed CDN URLs like Instagram's never accept an edited size, and this learns that within the first batch instead of paying for it on every picture.

Because known-small pictures are dropped at scan time, lowering Min size afterwards shows an amber "Min size lowered since scan: rescan"; raising it is just the live filter.

**Resolution** (`url.ts` + `probe.ts`): for each group Linki builds a candidate list — up to three higher-res URL guesses (site-specific rules first: Instagram, Twitter/X, Pinterest, Shopify, Flickr, Imgur, Wikimedia, Tumblr, Reddit, Discord, Google user content/Blogger, YouTube, Cloudinary, Squarespace, Bandcamp; then generic `-300x200`/`_600x600` suffixes, `-thumb`/`_small` words, `/thumbs/`, `/150x150/` segments, `?w=&h=&q=` params), then variants the page itself declared as full-size, then unknown-size variants, then declared variants larger than anything already measured. Candidates are probed **in the page's own context** as an `<img>` load, so cookies and referer match the page, and the download is aborted the moment the header yields a size. First candidate that loads wins unless a later one is declared larger than what loaded. Signed CDN URLs (Instagram's `oh=` signature) simply fail the probe and fall back to the largest variant the page provided, which is the correct answer for them. "Try higher-res URLs" OFF skips the guesses; Linki still measures and picks the largest variant the page offers.

**Filters** (`filter.ts`) are applied live to the last scan, so changing Min size or the Skip toggles never triggers a rescan (except lowering Min size, above). Rules: SVG/GIF skipped per toggle; with a minimum set, an image is kept when width × height ≥ N², and images whose size couldn't be verified are excluded and counted as "unverified"; with no minimum, everything is kept except 1×1 tracking pixels. Output is deduplicated by final URL across tabs, in working-set then document order.

**Tabs that can't be scanned**: discarded/unloaded tabs are skipped (scripting would reload them); tabs whose origin was declined, the Chrome Web Store and other unscriptable pages are reported as blocked; anything else that throws is "couldn't be scanned". Scan results go **stale** (amber warning, results kept) when the working set's tab ids change under them.

**Stale extension load**: Chrome re-reads an unpacked extension's popup files from disk on every open but only re-reads the manifest on load/reload, so after an update that adds the `scripting` permission the new popup can run against the old manifest with `chrome.scripting` absent. Scan checks for the API before doing anything and, if it is missing, shows "Linki was updated but the browser hasn't reloaded it. Reload Linki in chrome://extensions and try again." instead of reporting every tab as unscannable.

**Export** filename in Images mode: `linki-images-YYYY-MM-DD.txt`.

**Nothing is persisted.** Options reset to defaults each time the popup opens, same as the filter text.

## Design

- **Colour scheme**: Bitcrush Studio palette from `design_tokens.tsx`. The mode switch's active segment uses `accent-primary-muted` / `accent-primary`; warnings use `accent-warning`.
- **Icons**: Lucide React components for in-UI icons. Manifest icons (16/32/48/128 PNGs) generated at build time from a single Lucide SVG source.
- **Styling**: Tailwind for everything.

## Permissions

Manifest V3, minimum surface, escalated only on use:

- `tabs` — required to read tab URLs/titles and to close tabs. Links mode needs nothing else: `chrome.tabs.query` reads metadata directly without script injection.
- `activeTab` + `scripting` — Images mode injects its collector and prober into pages. `activeTab` covers the tab the user invoked Linki on without any prompt.
- `optional_host_permissions: ["http://*/*", "https://*/*"]` — never granted up front. When the user scans a working set that spans other tabs, Linki calls `chrome.permissions.request` for exactly those origins, from the Scan click. Grants are per site and revocable in `chrome://extensions`. No static `host_permissions`.

Linki has no servers and no telemetry, and stores nothing. The only network activity is the image probe during a scan: image loads from the page's own context against the sites being scanned, aborted after the header. Nothing is sent to anyone else.

## Codebase Rules

1. No docstrings unless absolutely necessary. Comments are minimal and in-line only.
2. All styling via Tailwind. No inline styles.
3. `.tsx` only. No `.jsx`.
4. `design_tokens.tsx` is the source of truth for colour, spacing, and typography.
5. Lucide for in-UI icons. Manifest icons generated as PNGs from Lucide SVGs at build time.
6. ESLint strict — zero errors, zero warnings.
7. Pre-commit hook (Husky + lint-staged): TypeScript compile, ESLint, and no `console.*` calls. Commit blocked on any failure.
8. Commit after each task.
9. Functions handed to `chrome.scripting.executeScript` (`lib/images/collect.ts`, `lib/images/probe.ts`) are serialised with `Function.prototype.toString`. They must be entirely self-contained: no imports used inside, no module-level helpers, no closures. Arguments and return values must survive JSON (no `Infinity`, no `undefined` in arrays).

## Distribution

- **Install target**: Chrome Web Store (decided 2026-07-16). Listing copy, permission justifications, and the privacy policy live in `store/`. The privacy policy must be hosted at a public URL before submission; screenshots are taken manually per the checklist in `store/listing.md`.