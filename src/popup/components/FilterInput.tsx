import { Search } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function FilterInput({ value, onChange }: Props) {
  return (
    <div className="relative mx-4 mt-2">
      <Search
        size={14}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        placeholder="Filter by site or path (e.g. reddit.com/r/pics)"
        spellCheck={false}
        autoFocus
        className="w-full rounded border border-border-strong bg-bg-elevated py-2 pl-9 pr-3 font-sans text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-primary"
      />
    </div>
  );
}
