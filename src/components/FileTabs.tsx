import { detectMode, getLanguageLabel } from "../lib/censorEngine";

export interface FileEntry {
  id: string;
  name: string;
  content: string;
  size: number;
}

interface FileTabsProps {
  files: FileEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  matchCounts: Record<string, number>;
}

export function FileTabs({
  files,
  activeId,
  onSelect,
  onClose,
  matchCounts,
}: FileTabsProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex gap-1 overflow-x-auto pb-1 terminal-scroll">
      {files.map((f) => {
        const active = f.id === activeId;
        const mode = detectMode(f.name);
        const hits = matchCounts[f.id] ?? 0;
        return (
          <div
            key={f.id}
            className={`group flex shrink-0 items-center gap-2 rounded-t-lg border px-3 py-2 font-mono text-xs transition ${
              active
                ? "border-cyan-500/40 border-b-transparent bg-slate-900 text-cyan-100"
                : "border-transparent bg-slate-950/50 text-slate-400 hover:bg-slate-900/80 hover:text-slate-200"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(f.id)}
              className="flex items-center gap-2"
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  mode === "code" ? "bg-sky-400" : "bg-amber-400"
                }`}
                title={getLanguageLabel(f.name)}
              />
              <span className="max-w-[140px] truncate">{f.name}</span>
              {hits > 0 && (
                <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
                  {hits}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label={`Close ${f.name}`}
              onClick={(e) => {
                e.stopPropagation();
                onClose(f.id);
              }}
              className="rounded p-0.5 text-slate-500 opacity-60 hover:bg-slate-800 hover:text-slate-200 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
