import { LoaderCircle, RefreshCw, ScanSearch } from "lucide-react";
import type { ScanState } from "../hooks/useImageScan";
import type { ImageFilters } from "../lib/images/types";
import type { FilterOutcome } from "../lib/images/types";

interface Props {
  state: ScanState;
  tabCount: number;
  // Why the last scan no longer matches the current settings or tabs, if it doesn't.
  stale: string | null;
  outcome: FilterOutcome | null;
  filters: ImageFilters;
  onScan: () => void;
}

const plural = (n: number, word: string) => `${String(n)} ${word}${n === 1 ? "" : "s"}`;

export function ScanPanel({ state, tabCount, stale, outcome, filters, onScan }: Props) {
  const scanning = state.status === "scanning";
  const tabs = plural(tabCount, "tab");

  let icon = <ScanSearch size={14} />;
  let label = `Scan ${tabs} for images`;
  if (state.status === "scanning") {
    icon = <LoaderCircle size={14} className="animate-spin" />;
    const { phase, done, total } = state.progress;
    label =
      phase === "collect"
        ? `Scanning tab ${String(Math.min(done + 1, total))} of ${String(total)}…`
        : total > 0
          ? `Checking sizes ${String(done)} of ${String(total)}…`
          : "Checking sizes…";
  } else if (state.status !== "idle") {
    icon = <RefreshCw size={14} />;
    label = `Rescan ${tabs}`;
  }

  return (
    <div className="px-4 pt-3">
      <button
        type="button"
        onClick={onScan}
        disabled={scanning || tabCount === 0}
        className="flex w-full items-center justify-center gap-1.5 rounded bg-accent-primary px-2 py-2 font-sans text-xs font-medium text-white transition-colors hover:bg-accent-primary-hover disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent-primary"
      >
        {icon}
        <span>{label}</span>
      </button>
      <Status state={state} stale={stale} outcome={outcome} filters={filters} />
    </div>
  );
}

interface StatusProps {
  state: ScanState;
  stale: string | null;
  outcome: FilterOutcome | null;
  filters: ImageFilters;
}

function Status({ state, stale, outcome, filters }: StatusProps) {
  if (state.status === "error") {
    return <p className="pt-2 font-mono text-xs text-accent-negative">{state.message}</p>;
  }
  if (state.status !== "done" || !outcome) return null;

  const { tabs, pruned } = state.report;
  const skipped: string[] = [];
  // Pictures the page itself declared too small were dropped at scan time;
  // they belong in the same bucket as the ones the live filter drops.
  const small = outcome.belowMin + pruned.small;
  if (small > 0) {
    const min = filters.minSize > 0 ? `under ${String(filters.minSize)} px²` : "tracking pixels";
    skipped.push(`${String(small)} ${min}`);
  }
  if (pruned.assets > 0) skipped.push(`${String(pruned.assets)} icons`);
  if (outcome.svg > 0) skipped.push(`${String(outcome.svg)} SVG`);
  if (outcome.gif > 0) skipped.push(`${String(outcome.gif)} GIF`);
  if (outcome.unverified > 0) skipped.push(`${String(outcome.unverified)} unverified size`);

  const warnings: string[] = [];
  if (tabs.denied > 0) warnings.push(`${plural(tabs.denied, "tab")} blocked: site access needed`);
  if (tabs.failed > 0) warnings.push(`${plural(tabs.failed, "tab")} couldn't be scanned`);
  if (tabs.unloaded > 0) warnings.push(`${plural(tabs.unloaded, "unloaded tab")} skipped: open and rescan`);
  if (stale !== null) warnings.push(stale);

  return (
    <div className="flex flex-col gap-0.5 pt-2 font-mono text-xs">
      <p className="text-text-secondary">
        {plural(outcome.kept.length, "image")} · {plural(tabs.scanned, "tab")} scanned
      </p>
      {skipped.length > 0 && <p className="text-text-muted">Skipped: {skipped.join(" · ")}</p>}
      {warnings.map((w) => (
        <p key={w} className="text-accent-warning">
          {w}
        </p>
      ))}
    </div>
  );
}
