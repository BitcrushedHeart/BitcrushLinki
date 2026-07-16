import { useMemo, useState } from "react";
import { ActionButtons } from "./components/ActionButtons";
import { FilterInput } from "./components/FilterInput";
import { Header } from "./components/Header";
import { TabCountLine } from "./components/TabCountLine";
import { UniqueToggle } from "./components/UniqueToggle";
import { useTabs } from "./hooks/useTabs";
import { matchesUrl } from "./lib/filter";
import { dedupe } from "./lib/normalize";

export default function App() {
  const tabs = useTabs();
  const [query, setQuery] = useState("");
  const [unique, setUnique] = useState(true);

  const matched = useMemo(
    () => tabs.filter((t) => matchesUrl(t.url, query)),
    [tabs, query],
  );

  const workingUrls = useMemo(() => {
    const all = matched.map((t) => t.url);
    return unique ? dedupe(all) : all;
  }, [matched, unique]);

  const workingIds = useMemo(() => matched.map((t) => t.id), [matched]);

  return (
    <main className="w-[360px] bg-bg-base font-sans">
      <Header />
      <TabCountLine
        matched={matched.length}
        total={tabs.length}
        filtering={query.trim() !== ""}
      />
      <FilterInput value={query} onChange={setQuery} />
      <UniqueToggle checked={unique} onChange={setUnique} />
      <ActionButtons urls={workingUrls} ids={workingIds} />
    </main>
  );
}
