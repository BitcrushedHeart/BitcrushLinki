import { useEffect, useState } from "react";

export type LinkTab = chrome.tabs.Tab & { id: number; url: string };

function isLinkTab(t: chrome.tabs.Tab): t is LinkTab {
  return typeof t.id === "number" && typeof t.url === "string" && /^https?:/i.test(t.url);
}

export function useTabs(): LinkTab[] {
  const [tabs, setTabs] = useState<LinkTab[]>([]);

  useEffect(() => {
    let cancelled = false;
    chrome.tabs
      .query({ currentWindow: true, pinned: false })
      .then((all) => {
        if (cancelled) return;
        setTabs(all.filter(isLinkTab));
      })
      .catch(() => {
        if (cancelled) return;
        setTabs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return tabs;
}
