import type { LinkTab } from "../../hooks/useTabs";

// The active tab is covered by activeTab; every other tab in the working set
// needs its origin granted at runtime (optional_host_permissions).
export function originsFor(tabs: readonly LinkTab[]): string[] {
  const out = new Set<string>();
  for (const tab of tabs) {
    if (tab.active) continue;
    try {
      const u = new URL(tab.url);
      out.add(`${u.protocol}//${u.host}/*`);
    } catch {
      // Not a URL we can scope a permission to.
    }
  }
  return [...out];
}

// Must be called synchronously from a user gesture (a click handler).
export async function requestSiteAccess(origins: readonly string[]): Promise<boolean> {
  if (origins.length === 0) return true;
  try {
    return await chrome.permissions.request({ origins: [...origins] });
  } catch {
    return false;
  }
}
