interface Props {
  matched: number;
  total: number;
  filtering: boolean;
}

export function TabCountLine({ matched, total, filtering }: Props) {
  const text = filtering
    ? `${String(matched)} of ${String(total)} tabs match`
    : `${String(total)} Open Tab${total === 1 ? "" : "s"}`;
  return (
    <p className="px-4 pt-3 font-mono text-xs text-text-secondary">{text}</p>
  );
}
