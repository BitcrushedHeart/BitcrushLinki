import { useMemo, useState } from "react";
import { ActionButtons } from "./components/ActionButtons";
import { FilterInput } from "./components/FilterInput";
import { Header } from "./components/Header";
import { ImageOptions } from "./components/ImageOptions";
import { ModeSwitch, type Mode } from "./components/ModeSwitch";
import { ScanPanel } from "./components/ScanPanel";
import { TabCountLine } from "./components/TabCountLine";
import { UniqueToggle } from "./components/UniqueToggle";
import { useImageScan } from "./hooks/useImageScan";
import { useTabs } from "./hooks/useTabs";
import { matchesUrl } from "./lib/filter";
import { applyImageFilters } from "./lib/images/filter";
import { DEFAULT_IMAGE_SETTINGS } from "./lib/images/settings";
import { dedupe } from "./lib/normalize";

function sameIds(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((id) => set.has(id));
}

export default function App() {
  const tabs = useTabs();
  const [mode, setMode] = useState<Mode>("links");
  const [query, setQuery] = useState("");
  const [unique, setUnique] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_IMAGE_SETTINGS);
  const { state: scan, scan: startScan } = useImageScan();

  const matched = useMemo(
    () => tabs.filter((t) => matchesUrl(t.url, query)),
    [tabs, query],
  );

  const workingUrls = useMemo(() => {
    const all = matched.map((t) => t.url);
    return unique ? dedupe(all) : all;
  }, [matched, unique]);

  const workingIds = useMemo(() => matched.map((t) => t.id), [matched]);

  const outcome = useMemo(
    () => (scan.status === "done" ? applyImageFilters(scan.report.images, settings) : null),
    [scan, settings],
  );
  const imageUrls = useMemo(() => outcome?.kept.map((i) => i.url) ?? [], [outcome]);
  // Pictures under the scan-time minimum were dropped before probing, so
  // lowering it afterwards needs a rescan; raising it is just a live filter.
  let stale: string | null = null;
  if (scan.status === "done") {
    if (!sameIds(scan.scannedIds, workingIds)) stale = "Tabs changed since scan: rescan";
    else if (settings.minSize < scan.minSize) stale = "Min size lowered since scan: rescan";
  }

  const images = mode === "images";

  return (
    <main className="w-[360px] bg-bg-base font-sans">
      <Header />
      <ModeSwitch mode={mode} onChange={setMode} />
      <TabCountLine
        matched={matched.length}
        total={tabs.length}
        filtering={query.trim() !== ""}
      />
      <FilterInput value={query} onChange={setQuery} />
      {images ? (
        <>
          <ImageOptions value={settings} onChange={setSettings} />
          <ScanPanel
            state={scan}
            tabCount={matched.length}
            stale={stale}
            outcome={outcome}
            filters={settings}
            onScan={() => { startScan(matched, { upgrade: settings.upgrade, minSize: settings.minSize }); }}
          />
        </>
      ) : (
        <UniqueToggle checked={unique} onChange={setUnique} />
      )}
      <ActionButtons
        urls={images ? imageUrls : workingUrls}
        ids={workingIds}
        filePrefix={images ? "images" : "export"}
      />
    </main>
  );
}
