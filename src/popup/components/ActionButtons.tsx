import { useState, type ReactNode } from "react";
import { Check, Copy, Download, X } from "lucide-react";
import { closeTabs, copy, exportFile } from "../lib/actions";

interface Props {
  urls: readonly string[];
  ids: readonly number[];
}

type FlashKey = "copy" | "export" | null;

export function ActionButtons({ urls, ids }: Props) {
  const [flash, setFlash] = useState<FlashKey>(null);
  const disabled = urls.length === 0;

  const showFlash = (key: Exclude<FlashKey, null>) => {
    setFlash(key);
    window.setTimeout(() => {
      setFlash((curr) => (curr === key ? null : curr));
    }, 1400);
  };

  const onCopy = async () => {
    await copy(urls);
    showFlash("copy");
  };

  const onExport = () => {
    exportFile(urls);
    showFlash("export");
  };

  const onCopyClose = async () => {
    await copy(urls);
    await closeTabs(ids);
  };

  const onExportClose = async () => {
    exportFile(urls);
    await closeTabs(ids);
  };

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3">
      <ActionButton
        onClick={onCopy}
        disabled={disabled}
        icon={flash === "copy" ? <Check size={14} /> : <Copy size={14} />}
        label="Copy"
      />
      <ActionButton
        onClick={onExport}
        disabled={disabled}
        icon={flash === "export" ? <Check size={14} /> : <Download size={14} />}
        label="Export"
      />
      <ActionButton
        onClick={onCopyClose}
        disabled={disabled}
        emphasis
        icon={
          <span className="flex items-center gap-0.5">
            <Copy size={14} />
            <X size={12} />
          </span>
        }
        label="Copy & Close"
      />
      <ActionButton
        onClick={onExportClose}
        disabled={disabled}
        emphasis
        icon={
          <span className="flex items-center gap-0.5">
            <Download size={14} />
            <X size={12} />
          </span>
        }
        label="Export & Close"
      />
    </div>
  );
}

interface ButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void | Promise<void>;
  disabled: boolean;
  emphasis?: boolean;
}

function ActionButton({ icon, label, onClick, disabled, emphasis = false }: ButtonProps) {
  const base =
    "flex items-center justify-center gap-1.5 rounded px-2 py-2 font-sans text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const styles = emphasis
    ? "bg-accent-primary text-white hover:bg-accent-primary-hover disabled:hover:bg-accent-primary"
    : "border border-border-subtle bg-bg-elevated text-text-primary hover:bg-bg-surface disabled:hover:bg-bg-elevated";
  return (
    <button
      type="button"
      onClick={() => {
        void onClick();
      }}
      disabled={disabled}
      className={`${base} ${styles}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
