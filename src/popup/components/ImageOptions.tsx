import type { ImageSettings } from "../lib/images/settings";

interface Props {
  value: ImageSettings;
  onChange: (value: ImageSettings) => void;
}

export function ImageOptions({ value, onChange }: Props) {
  const set = (patch: Partial<ImageSettings>) => {
    onChange({ ...value, ...patch });
  };
  return (
    <div className="mx-4 mt-3 flex flex-col gap-2 font-sans text-xs text-text-secondary">
      <div className="flex items-center gap-2">
        <span>Min size</span>
        <SizeInput label="Minimum width in pixels" value={value.minWidth} onChange={(minWidth) => { set({ minWidth }); }} />
        <span className="text-text-muted">×</span>
        <SizeInput label="Minimum height in pixels" value={value.minHeight} onChange={(minHeight) => { set({ minHeight }); }} />
        <span className="text-text-muted">px</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Check label="Skip SVG" checked={value.skipSvg} onChange={(skipSvg) => { set({ skipSvg }); }} />
        <Check label="Skip GIF" checked={value.skipGif} onChange={(skipGif) => { set({ skipGif }); }} />
        <Check label="Try higher-res URLs" checked={value.upgrade} onChange={(upgrade) => { set({ upgrade }); }} />
      </div>
    </div>
  );
}

interface SizeInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function SizeInput({ label, value, onChange }: SizeInputProps) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={0}
      step={1}
      aria-label={label}
      placeholder="0"
      value={value === 0 ? "" : String(value)}
      onChange={(e) => {
        const n = Number.parseInt(e.target.value, 10);
        onChange(Number.isFinite(n) && n > 0 ? n : 0);
      }}
      className="w-16 rounded border border-border-strong bg-bg-elevated px-2 py-1 font-mono text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-accent-primary"
    />
  );
}

interface CheckProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Check({ label, checked, onChange }: CheckProps) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { onChange(e.target.checked); }}
        className="h-3.5 w-3.5 cursor-pointer accent-accent-primary"
      />
      {label}
    </label>
  );
}
