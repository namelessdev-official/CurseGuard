import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from "react";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPT =
  ".js,.jsx,.ts,.tsx,.mjs,.cjs,.html,.htm,.css,.scss,.json,.py,.rb,.go,.rs,.java,.php,.md,.mdx,.txt,.yml,.yaml,.xml,.sql,.sh,.vue,.svelte,.c,.cpp,.h,.cs,.swift,.kt,.log,.csv,.toml,.env,.svg";

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list) return;
      const files = Array.from(list).filter((f) => f.size <= 5 * 1024 * 1024);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`group relative cursor-pointer overflow-hidden rounded-xl border border-dashed transition-all duration-300 ${
        hover
          ? "animate-pulse-border border-cyan-400/70 bg-cyan-400/10"
          : "border-slate-600/80 bg-slate-900/40 hover:border-cyan-500/40 hover:bg-slate-900/70"
      } ${disabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-10 text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-colors ${
            hover
              ? "border-cyan-400/50 bg-cyan-400/15 text-cyan-300"
              : "border-slate-700 bg-slate-950 text-slate-400 group-hover:border-cyan-500/30 group-hover:text-cyan-300"
          }`}
        >
          <svg
            className="h-7 w-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <path
              d="M12 16V4m0 0l-4 4m4-4l4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-100">
            Drop files to quarantine NSFW language
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            HTML · JS · TS · PY · MD · TXT · CSS · JSON · and more · max 5MB
          </p>
        </div>
        <button
          type="button"
          className="mt-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs text-cyan-300 transition hover:bg-cyan-500/20"
        >
          SELECT_TARGETS
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={onChange}
      />
      <div className="pointer-events-none absolute inset-0 scanlines opacity-30" />
    </div>
  );
}
