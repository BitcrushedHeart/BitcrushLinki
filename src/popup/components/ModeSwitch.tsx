import type { ReactNode } from "react";
import { Image as ImageIcon, Link } from "lucide-react";

export type Mode = "links" | "images";

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSwitch({ mode, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="What to collect"
      className="mx-4 mt-3 grid grid-cols-2 gap-0.5 rounded border border-border-subtle bg-bg-elevated p-0.5"
    >
      <Segment active={mode === "links"} onClick={() => { onChange("links"); }} icon={<Link size={13} />} label="Links" />
      <Segment active={mode === "images"} onClick={() => { onChange("images"); }} icon={<ImageIcon size={13} />} label="Images" />
    </div>
  );
}

interface SegmentProps {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

function Segment({ active, onClick, icon, label }: SegmentProps) {
  const styles = active
    ? "bg-accent-primary-muted text-accent-primary"
    : "text-text-secondary hover:text-text-primary";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 font-sans text-xs font-medium transition-colors ${styles}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
