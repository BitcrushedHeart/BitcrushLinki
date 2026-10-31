# Linki Privacy Policy

**Effective date:** 31 October 2026

Linki is a browser extension that copies or exports the URLs of your open
tabs, or the URLs of the images on those pages, and can close those tabs at
your request.

## What Linki collects

Nothing. Linki does not collect, store, transmit, sell, or share any data,
personal or otherwise.

## How Linki works with your data

When you open the Linki popup, it reads the URL, title, and pinned state of
the tabs in your current browser window using the browser's `tabs` permission.
This information is used only to display the tab count, apply your filter, and
build the list of links you asked for. The list is written to your clipboard
(Copy) or saved as a text file on your device (Export).

When you click **Scan** in Images mode, Linki runs a small script inside the
tabs you chose (using the `activeTab` and `scripting` permissions, and asking
you for access to any other site in your selection at that moment) to find the
image URLs on those pages. To confirm that a candidate image exists and to read
its dimensions, Linki loads it from your browser in the same way the page
itself would, stopping as soon as the file header has been read. Those requests
go only to the image servers of the sites you are scanning. The resulting list
of image URLs goes to your clipboard or a text file on your device, exactly like
links. That is the entire data flow.

- Linki has **no servers** and sends nothing to the developer or any third
  party. Its only network activity is loading images from the sites you scan,
  on your click, as described above.
- Linki has **no analytics or telemetry**.
- Linki has **no accounts, no sign-in, and no storage** — it remembers nothing
  between uses.
- All processing happens locally in your browser.
- Site access granted for an image scan can be revoked at any time from your
  browser's extensions page.

## Third parties

No data is shared with third parties. The only parties your browser contacts
on Linki's behalf are the websites you chose to scan, and only to load their
own images.

## Changes

If a future version of Linki changes any of the above, this policy will be
updated before that version is released, and the extension's store listing
will disclose the change.

## Contact

Questions about this policy: callancartledge@gmail.com
