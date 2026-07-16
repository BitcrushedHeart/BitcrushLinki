export async function copy(urls: readonly string[]): Promise<void> {
  await navigator.clipboard.writeText(urls.join("\n"));
}

function localDateStamp(d: Date): string {
  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function exportFile(urls: readonly string[]): void {
  const blob = new Blob([urls.join("\n")], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const date = localDateStamp(new Date());
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `linki-export-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Defer revocation so the download has time to register with the browser.
  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function closeTabs(ids: readonly number[]): Promise<void> {
  if (ids.length === 0) return;
  await chrome.tabs.remove([...ids]);
}
