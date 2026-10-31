<p align="center">
  <a href="https://www.patreon.com/cw/Bitcrushed_Heart">
    <img src="https://img.shields.io/badge/Patreon-Bitcrushed__Heart-bb00a1?style=flat&amp;logo=patreon&amp;logoSize=auto" alt="Patreon: Bitcrushed Heart">
  </a>
  <a href="https://civitai.red/user/BitcrushedHeart">
    <img src="https://img.shields.io/badge/Civitai%20Red-BitcrushedHeart-68005b?style=flat&amp;logo=robotframework&amp;logoSize=auto" alt="Civitai Red: BitcrushedHeart">
  </a>
  <a href="https://civitai.red/user/BitcrushedHeart">
    <img src="https://img.shields.io/badge/Discord-Join%20Now-c9007a?style=flat&logo=discord" alt="Badge">
  </a>
</p>

<h1 align="center">Bitcrush Linki</h1>

<p align="center">
  Bitcrush Linki is a Chromium extension for bulk-copying links, and the images on those pages, from your open tabs. Free and open source.
</p>

## What it does

You have 30 tabs open and 22 of them are from the same site. You want to save those links somewhere and close the tabs, without doing it one at a time. Linki filters your open tabs by hostname, then copies, exports, or closes the matching set in a single click.

The filter defines the working set. Every action operates on that set, and tabs outside it are never touched. An empty filter means the working set is every open tab.

Images mode does the same for pictures: scan the working set, get one clean list of direct image URLs at the best resolution Linki can find, with the icons, SVGs and thumbnails filtered out. It works on pages that don't let you right-click and save, like Instagram, because it reads the image URLs out of the page rather than the picture you see.

## Features

- **Filter by hostname.** Case-insensitive substring match against the tab hostname. Typing "pinterest" matches `pinterest.com`, `uk.pinterest.com`, and `pinterest.co.uk`. Paths and query strings are ignored.
- **Live tab count.** See how many tabs match the current filter out of your total.
- **Unique Links Only.** On by default. Normalises URLs by stripping common tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`, `ref_src`) before removing duplicates. Turn it off to keep every tab's URL as-is.
- **Copy.** Writes the working set to the clipboard as plain text, one link per line.
- **Export.** Downloads the working set as a `.txt` file, named `linki-export-YYYY-MM-DD.txt`.
- **Copy and Close / Export and Close.** Runs the copy or export, then closes every tab in the working set.

### Images mode

- **Finds images however they're embedded.** `<img>` tags and every `srcset`/`<picture>` variant, lazy-load `data-*` attributes, CSS background images, Open Graph metadata, links that point straight at an image, and image URLs buried in the page's inline JavaScript and JSON (which is where Instagram keeps them).
- **Picks the highest resolution.** Variants of the same picture are grouped, and Linki tries known higher-resolution forms of the URL: Instagram, Twitter/X, Pinterest, Reddit, Tumblr, Flickr, Imgur, Discord, Wikipedia, YouTube thumbnails, Shopify, WordPress, Cloudinary, Squarespace, Google user content, plus generic `?w=600`, `-300x200.jpg`, `/thumbs/` patterns. Every candidate is checked against the real site before it's used, so you only ever get URLs that actually load.
- **Boundaries.** A minimum size in square pixels (default 512: an image passes when √(width × height) ≥ 512, whatever its aspect ratio; set to 0 to disable), skip SVG (on by default), skip GIF. Filters apply live to the last scan; only lowering the minimum needs a rescan.
- **Doesn't waste time on junk.** Avatars, thumbnails, icons and sprites the page already shows to be too small are dropped before Linki checks any sizes, each picture is checked once across all your tabs, and once a CDN has refused a few higher-res guesses Linki stops guessing there.
- **Honest about what it couldn't verify.** The result line says how many images were skipped and why: below the minimum, SVG, GIF, or a size it couldn't confirm.
- **Same four actions.** Copy, Export (as `linki-images-YYYY-MM-DD.txt`), Copy & Close, Export & Close, all operating on the scanned image URLs and the working set's tabs.

## Privacy

Linki asks for the minimum surface it needs, and asks for more only when you use the feature that needs it.

- **Links mode** uses only the `tabs` permission to read tab URLs and to close tabs. Nothing is injected into any page.
- **Images mode** has to read the pages themselves. It uses `activeTab` and `scripting` to run its collector in the tab you're on, and asks for access to the other sites in your working set at the moment you scan them. Those grants are per site, happen only after you click Scan, and can be revoked at any time from `chrome://extensions`.

Linki has no servers and no telemetry, and stores nothing. The only network activity it ever performs is during an image scan, when it loads candidate image URLs from the sites you are scanning to confirm they exist and read their dimensions. Those requests go only to the image hosts the page itself uses, look exactly like the page loading the picture, and stop as soon as the file header has been read. Nothing about you or your tabs is sent anywhere.

## Installation

> [!NOTE]
> Linki is not yet on the Chrome Web Store. For now it is loaded unpacked from a local build.

### Load unpacked (Chrome, Edge, Brave, and other Chromium browsers)

1. Download the latest build from the [Releases tab](https://github.com/BitcrushedHeart/BitcrushLinki/releases), or build it yourself (see below).
2. Open `chrome://extensions` in your browser.
3. Turn on **Developer mode** (top-right).
4. Click **Load unpacked** and select the build output folder (`dist`).
5. Pin the Linki icon to your toolbar and click it to open the popup.

## Building from source

Requires [Node.js](https://nodejs.org/).

```bash
git clone https://github.com/BitcrushedHeart/BitcrushLinki.git
cd BitcrushLinki
npm install
npm run build
```

The unpacked extension is written to `dist`. Load it as described above.

For development with hot reload:

```bash
npm run dev
```

## Built with

React 19, Tailwind 4, Vite, TypeScript, and Manifest V3. In-UI icons are Lucide React components; the toolbar icons are generated from a single Lucide SVG at build time.

## Bug Reporting and Feature Suggestions

Please raise any bugs or feature requests in the [Issues Tab](https://github.com/BitcrushedHeart/BitcrushLinki/issues) on GitHub.

## Summary and Credits

Thank you to everyone that has supported me during my time in the machine-learning community.

**Made with <3 By BitcrushedHeart**

## License

Bitcrush Linki is free and open source.

## Related Projects

[**Bitcrush Studio**](https://github.com/BitcrushedHeart/BitcrushStudio) - Desktop app for building, captioning, cleaning, reviewing, and preparing large image-caption datasets.
