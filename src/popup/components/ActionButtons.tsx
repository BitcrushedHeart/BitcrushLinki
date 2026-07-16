import { useState, type ReactNode } from "react";
import { Check, Copy, Download, TriangleAlert, X } from "lucide-react";
import { closeTabs, copy, delay, exportFile } from "../lib/actions";

interface Props {
  urls: readonly string[];
  ids: readonly number[];
}

type ActionKey = "copy" | "export" | "copyClose" | "exportClose";
type Flash = { key: ActionKey; error: boolean } | null;

export function ActionButtons({ urls, ids }: Props) {
  const [flash, setFlash] = useState<Flash>(null);
  const disabled = urls.length === 0;

  const showFlash = (key: ActionKey, error: boolean) => {
    setFlash({ key, error });
    window.setTimeout(() => {
      setFlash((curr) => (curr?.key === key ? null : curr));
    }, 1400);
  };

  const flashError = (key: ActionKey) => {
    showFlash(key, true);
  };

  const onCopy = async () => {
    try {
      await copy(urls);
    } catch {
      flashError("copy");
      return;
    }
    showFlash("copy", false);
  };

  const onExport = () => {
    exportFile(urls);
    showFlash("export", false);
  };

  const onCopyClose = async () => {
    try {
      await copy(urls);
    } catch {
      flashError("copyClose");
      return;
    }
    await closeTabs(ids);
    window.close();
  };

  const onExportClose = async () => {
    exportFile(urls);
    // Give the browser time to register the download before closing tabs,
    // which may close the window and tear down this popup document.
    await delay(200);
    await closeTabs(ids);
    window.close();
  };

  const isError = (key: ActionKey) => flash?.key === key && flash.error;
  const isSuccess = (key: ActionKey) => flash?.key === key && !flash.error;
  const errorIcon = <TriangleAlert size={14} />;

  return (
    <div className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3">
      <ActionButton
        onClick={onCopy}
        disabled={disabled}
        error={isError("copy")}
        icon={
          isError("copy") ? (
            errorIcon
          ) : isSuccess("copy") ? (
            <Check size={14} />
          ) : (
            <Copy size={14} />
          )
        }
        label="Copy"
      />
      <ActionButton
        onClick={onExport}
        disabled={disabled}
        error={isError("export")}
        icon={isSuccess("export") ? <Check size={14} /> : <Download size={14} />}
        label="Export"
      />
      <ActionButton
        onClick={onCopyClose}
        disabled={disabled}
        emphasis
        error={isError("copyClose")}
        icon={
          isError("copyClose") ? (
            errorIcon
          ) : (
            <span className="flex items-center gap-0.5">
              <Copy size={14} />
              <X size={12} />
            </span>
          )
        }
        label="Copy & Close"
      />
      <ActionButton
        onClick={onExportClose}
        disabled={disabled}
        emphasis
        error={isError("exportClose")}
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
  error?: boolean;
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  emphasis = false,
  error = false,
}: ButtonProps) {
  const base =
    "flex items-center justify-center gap-1.5 rounded px-2 py-2 font-sans text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  const emphasisStyles = emphasis
    ? "bg-accent-primary text-white hover:bg-accent-primary-hover disabled:hover:bg-accent-primary"
    : "border border-border-subtle bg-bg-elevated text-text-primary hover:bg-bg-surface disabled:hover:bg-bg-elevated";
  const styles = error
    ? "border border-accent-negative bg-bg-elevated text-accent-negative hover:bg-bg-surface disabled:hover:bg-bg-elevated"
    : emphasisStyles;
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
