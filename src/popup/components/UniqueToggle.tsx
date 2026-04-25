interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function UniqueToggle({ checked, onChange }: Props) {
  return (
    <label className="mx-4 mt-3 flex cursor-pointer select-none items-center gap-2 font-sans text-xs text-text-secondary">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => { onChange(e.target.checked); }}
        className="h-3.5 w-3.5 cursor-pointer accent-accent-primary"
      />
      Unique Links Only
    </label>
  );
}
