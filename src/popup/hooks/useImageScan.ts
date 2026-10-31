import { useRef, useState } from "react";
import { originsFor, requestSiteAccess } from "../lib/images/access";
import { scanTabs } from "../lib/images/resolve";
import type { ScanOptions, ScanProgress, ScanReport } from "../lib/images/types";
import type { LinkTab } from "./useTabs";

export type ScanState =
  | { status: "idle" }
  | { status: "scanning"; progress: ScanProgress }
  | { status: "done"; report: ScanReport; scannedIds: readonly number[]; minSize: number }
  | { status: "error"; message: string };

// Chrome re-reads an unpacked extension's popup files from disk on every open
// but only re-reads the manifest on load/reload. After an update that adds the
// `scripting` permission, the new popup can run against the old manifest, and
// `chrome.scripting` is simply absent. Every tab would otherwise report as
// "couldn't be scanned" with no hint.
const STALE_LOAD_MESSAGE =
  "Linki was updated but the browser hasn't reloaded it. Reload Linki in chrome://extensions and try again.";

function hasScriptingApi(): boolean {
  const scripting: unknown = (chrome as { scripting?: unknown }).scripting;
  return typeof scripting === "object" && scripting !== null && typeof (scripting as { executeScript?: unknown }).executeScript === "function";
}

export function useImageScan(): { state: ScanState; scan: (tabs: readonly LinkTab[], options: ScanOptions) => void } {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const running = useRef(false);

  const scan = (tabs: readonly LinkTab[], options: ScanOptions): void => {
    if (running.current || tabs.length === 0) return;
    if (!hasScriptingApi()) {
      setState({ status: "error", message: STALE_LOAD_MESSAGE });
      return;
    }
    running.current = true;
    setState({ status: "scanning", progress: { phase: "collect", done: 0, total: tabs.length } });
    // The permission prompt needs the click's user gesture, so request before any await.
    // A declined prompt isn't fatal: the active tab still scans, the rest report as blocked.
    const access = requestSiteAccess(originsFor(tabs));
    void (async () => {
      await access;
      try {
        const report = await scanTabs(tabs, options, (progress) => {
          setState({ status: "scanning", progress });
        });
        setState({ status: "done", report, scannedIds: tabs.map((t) => t.id), minSize: options.minSize });
      } catch (error: unknown) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Scan failed" });
      } finally {
        running.current = false;
      }
    })();
  };

  return { state, scan };
}
