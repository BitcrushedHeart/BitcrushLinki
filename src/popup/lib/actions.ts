export async function copy(urls: readonly string[]): Promise<void> {
  await navigator.clipboard.writeText(urls.join("\n"));
}

export function exportFile(urls: readonly string[]): void {
  const blob = new Blob([urls.join("\n")], { type: "text/plain;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `linki-export-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function closeTabs(ids: readonly number[]): Promise<void> {
  if (ids.length === 0) return;
  await chrome.tabs.remove([...ids]);
}
