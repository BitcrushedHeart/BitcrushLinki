# Chrome Web Store Listing — Linki

Everything below is copy-paste material for the Developer Console. Character
limits noted where the store enforces them.

## Basics

- **Name**: Linki
- **Category**: Productivity → Tools
- **Language**: English

## Short description (max 132 chars)

> Bulk-copy or export links from your open tabs, or every image on them. Filter by site, set size limits, and close tabs in one click.

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
> **Images mode** does the same for the pictures on those pages. Hit Scan and
> Linki finds every image in the matching tabs, however it's embedded: plain
> image tags, responsive srcset variants, lazy-loaded images, CSS backgrounds,
> and image URLs tucked away in the page's own JavaScript (yes, Instagram). It
> groups the variants of each picture, tries the known higher-resolution forms
> of the URL for sites like Instagram, Twitter/X, Pinterest, Reddit, Tumblr,
> Flickr, Imgur, WordPress and Shopify, checks that each one really loads, and
> gives you one clean list of direct links at the best size available. Set a
> minimum width and height, skip SVGs and GIFs, then Copy or Export exactly as
> you would with links.
>
> **Private by design.** Linki has no servers, no analytics, no accounts, and
> no storage. Links mode asks only for the permission that lets it read and
> close your tabs. Images mode needs to read the pages it scans, so it asks for
> access to each site at the moment you scan it, and only for that site. The
> one time Linki touches the network is during an image scan, when it loads
> image URLs from the sites you're scanning to check they exist and read their
> size, exactly as the page itself would. Nothing you do in it is sent to
> anyone.
>
> A Bitcrush Tool.

## Privacy tab

### Single purpose description

> Linki collects URLs from the user's open tabs — the tab links themselves, or
> the direct image URLs found on those pages — optionally filtered by site,
> size and type, deduplicated, and can close those tabs on request.

### Permission justification — `tabs`

> The tabs permission is required to (1) read the URL, title, and pinned state
> of open tabs in the current window so they can be filtered and their links
> copied or exported, and (2) close the matching tabs when the user clicks
> "Copy & Close" or "Export & Close". Tab data is processed entirely locally
> and stored nowhere. URLs are written only to the user's clipboard or to a
> local .txt file the user downloads.

### Permission justification — `activeTab`

> Images mode reads the images embedded in the page the user has open. activeTab
> lets the extension run its image collector in the tab the user invoked it on,
> only after they click the toolbar icon and then click "Scan", without any
> standing access to that site.

### Permission justification — `scripting`

> Required to run the image collector in a page (chrome.scripting.executeScript)
> when the user clicks "Scan" in Images mode. The injected code reads image
> elements, srcset/lazy-load attributes, CSS backgrounds and inline script text
> to find image URLs, and loads candidate image URLs to confirm their size. It
> never modifies the page, never reads form data or cookies, and runs only on
> the user's explicit click.

### Permission justification — optional host permissions (`http://*/*`, `https://*/*`)

> Declared as optional_host_permissions, never requested at install. When the
> user's image scan spans tabs other than the active one, the extension calls
> chrome.permissions.request for exactly those tabs' origins at the moment the
> user clicks "Scan", so the collector can run in those tabs too. The user can
> decline (the active tab is still scanned) and can revoke any grant from
> chrome://extensions. No static host_permissions are declared.

### Remote code

> No. All code ships in the package. The extension loads image URLs from the
> sites being scanned only to read their dimensions; it never executes anything
> fetched from the network.

### Data usage disclosures

- Collects user data: **No** (check none of the data categories). Image probes
  go from the user's browser to the scanned sites' own image hosts; nothing is
  transmitted to the developer or any third party.
- Certification statements: all three (no sale, no unrelated use, no
  creditworthiness use) can be certified truthfully.

### Privacy policy URL

Host `store/privacy-policy.md` publicly (e.g. GitHub Pages or the repo's raw
URL) and paste that URL. A policy URL is required because the `tabs`,
`activeTab`, `scripting` and host permissions handle user data.

## Assets

- **Icon 128×128**: `dist/icons/icon-128.png` (uploaded automatically with the zip; the console also asks for it in the listing).
- **Screenshots (1280×800 or 640×400, at least 1)**: take a shot of the popup
  open over a window full of tabs, ideally showing an active filter
  ("22 of 30 tabs match"), and a second in Images mode after a scan ("143
  images · 22 tabs scanned"). Needs a real browser session — not automated.
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
5. Set visibility, submit for review. Extensions with `tabs`, `scripting` and
   broad optional host permissions get a closer look; expect a few days, and
   expect the permission justifications above to be read.
