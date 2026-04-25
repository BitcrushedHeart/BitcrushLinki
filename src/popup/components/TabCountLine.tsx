interface Props {
  matched: number;
  total: number;
}

export function TabCountLine({ matched, total }: Props) {
  const text =
    matched === total
      ? `${String(total)} Open Tab${total === 1 ? "" : "s"}`
      : `${String(matched)} of ${String(total)} tabs match`;
  return (
    <p className="px-4 pt-3 font-mono text-xs text-text-secondary">{text}</p>
  );
}
