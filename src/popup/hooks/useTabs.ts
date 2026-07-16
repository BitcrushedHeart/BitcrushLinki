import { useEffect, useState } from "react";

export type LinkTab = chrome.tabs.Tab & { id: number; url: string };

function isLinkTab(t: chrome.tabs.Tab): t is LinkTab {
  return typeof t.id === "number" && typeof t.url === "string" && /^https?:/i.test(t.url);
}

export function useTabs(): LinkTab[] {
  const [tabs, setTabs] = useState<LinkTab[]>([]);

  useEffect(() => {
    let cancelled = false;
    let generation = 0;

    const refresh = () => {
      const gen = ++generation;
      chrome.tabs
        .query({ currentWindow: true, pinned: false })
        .then((all) => {
          // Ignore stale queries so overlapping refreshes can't apply out of order
          if (cancelled || gen !== generation) return;
          setTabs(all.filter(isLinkTab));
        })
        .catch(() => {
          if (cancelled || gen !== generation) return;
          setTabs([]);
        });
    };

    const onEvent = () => {
      refresh();
    };

    refresh();
    chrome.tabs.onRemoved.addListener(onEvent);
    chrome.tabs.onCreated.addListener(onEvent);
    chrome.tabs.onUpdated.addListener(onEvent);

    return () => {
      cancelled = true;
      chrome.tabs.onRemoved.removeListener(onEvent);
      chrome.tabs.onCreated.removeListener(onEvent);
      chrome.tabs.onUpdated.removeListener(onEvent);
    };
  }, []);

  return tabs;
}
