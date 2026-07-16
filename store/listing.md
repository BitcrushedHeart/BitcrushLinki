# Chrome Web Store Listing — Linki

Everything below is copy-paste material for the Developer Console. Character
limits noted where the store enforces them.

## Basics

- **Name**: Linki
- **Category**: Productivity → Tools
- **Language**: English

## Short description (max 132 chars)

> Bulk-copy or export links from your open tabs. Filter by site, strip tracking params, and close the tabs in one click.

## Detailed description

> Thirty tabs open, twenty-two of them from the same site, and you want to save
> those links somewhere and move on with your life. Linki does exactly that.
>
> Type a filter — a hostname, or a hostname + path like "reddit.com/r/pics" —
> and Linki shows how many open tabs match. Then pick an action:
>
> • **Copy** — the matching URLs go to your clipboard, one per line.
> • **Export** — the matching URLs download as a plain .txt file.
> • **Copy & Close / Export & Close** — same as above, then every matching tab
>   closes in one go.
>
> Leave the filter empty and the actions apply to every open tab in the window.
>
> **Unique Links Only** (on by default) strips common tracking parameters
> (utm_*, fbclid, gclid, ref, ref_src) and removes duplicates, so what you save
> is a clean list of links, not tracking soup.
>
> Pinned tabs are never touched, so your permanent tabs are safe from bulk-close.
>
> **Private by design.** Linki has no network access, no analytics, no accounts,
> and no storage. Nothing you do in it leaves your browser — the only permission
> it asks for is the one that lets it read and close your tabs, and that data
> goes to your clipboard or a local file, nowhere else.
>
> A Bitcrush Tool.

## Privacy tab

### Single purpose description

> Linki copies or exports the URLs of the user's open tabs (optionally filtered
> by site and deduplicated) and can close those tabs on request.

### Permission justification — `tabs`

> The tabs permission is required to (1) read the URL, title, and pinned state
> of open tabs in the current window so they can be filtered and their links
> copied or exported, and (2) close the matching tabs when the user clicks
> "Copy & Close" or "Export & Close". Tab data is processed entirely locally:
> the extension has no host permissions, makes no network requests, and stores
> nothing. URLs are written only to the user's clipboard or to a local .txt
> file the user downloads.

### Data usage disclosures

- Collects user data: **No** (check none of the data categories)
- Certification statements: all three (no sale, no unrelated use, no
  creditworthiness use) can be certified truthfully.

### Privacy policy URL

Host `store/privacy-policy.md` publicly (e.g. GitHub Pages or the repo's raw
URL) and paste that URL. A policy URL is required because the `tabs`
permission handles user data.

## Assets

- **Icon 128×128**: `dist/icons/icon-128.png` (uploaded automatically with the zip; the console also asks for it in the listing).
- **Screenshots (1280×800 or 640×400, at least 1)**: take a shot of the popup
  open over a window full of tabs, ideally showing an active filter
  ("22 of 30 tabs match"). Needs a real browser session — not automated.
- **Promo tiles (optional)**: small 440×280; skip for v1 unless featured
  placement matters.

## Distribution

- **Visibility**: consider *Unlisted* for a soft launch (installable via link,
  not searchable), flip to *Public* later — no re-review needed for the flip.
- **Regions**: all.

## Submission checklist

1. `npm run build`, zip the **contents** of `dist/` (manifest.json at zip root).
2. Developer Console → New item → upload zip.
3. Paste listing copy and privacy answers from this file.
4. Upload screenshot(s).
5. Set visibility, submit for review. `tabs`-permission extensions can take a
   few days.
