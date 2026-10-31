import { useRef, useState } from "react";
import { originsFor, requestSiteAccess } from "../lib/images/access";
import { scanTabs } from "../lib/images/resolve";
import type { ScanOptions, ScanProgress, ScanReport } from "../lib/images/types";
import type { LinkTab } from "./useTabs";

export type ScanState =
  | { status: "idle" }
  | { status: "scanning"; progress: ScanProgress }
  | { status: "done"; report: ScanReport; scannedIds: readonly number[] }
  | { status: "error"; message: string };

export function useImageScan(): { state: ScanState; scan: (tabs: readonly LinkTab[], options: ScanOptions) => void } {
  const [state, setState] = useState<ScanState>({ status: "idle" });
  const running = useRef(false);

  const scan = (tabs: readonly LinkTab[], options: ScanOptions): void => {
    if (running.current || tabs.length === 0) return;
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
        setState({ status: "done", report, scannedIds: tabs.map((t) => t.id) });
      } catch (error: unknown) {
        setState({ status: "error", message: error instanceof Error ? error.message : "Scan failed" });
      } finally {
        running.current = false;
      }
    })();
  };

  return { state, scan };
}
