import type { CensorResult } from "../lib/censorEngine";

interface StatsBarProps {
  result: CensorResult | null;
  fileCount: number;
  processing: boolean;
}

export function StatsBar({ result, fileCount, processing }: StatsBarProps) {
  const items = [
    {
      label: "FILES",
      value: String(fileCount),
      color: "text-cyan-300",
    },
    {
      label: "THREATS",
      value: result ? String(result.stats.totalMatches) : "—",
      color: result && result.stats.totalMatches > 0 ? "text-rose-400" : "text-emerald-400",
    },
    {
      label: "UNIQUE",
      value: result ? String(result.stats.uniqueWords) : "—",
      color: "text-amber-300",
    },
    {
      label: "REGIONS",
      value: result ? String(result.stats.regionsScanned) : "—",
      color: "text-sky-300",
    },
    {
      label: "PROFILE",
      value: result ? result.mode.toUpperCase() : "—",
      color: "text-violet-300",
    },
    {
      label: "STATUS",
      value: processing ? "SCAN…" : result ? "CLEAN" : "IDLE",
      color: processing ? "text-amber-300" : result ? "text-emerald-400" : "text-slate-400",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-slate-700/70 bg-slate-950/60 px-2 py-2 text-center"
        >
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </div>
          <div className={`mt-1 font-mono text-sm font-semibold ${item.color}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
