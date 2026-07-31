import type { CensorMatch } from "../lib/censorEngine";

interface MatchListProps {
  matches: CensorMatch[];
}

export function MatchList({ matches }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="panel rounded-xl p-4">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/90">
          // threat_log
        </h3>
        <p className="mt-3 font-mono text-xs text-slate-500">
          No profanity signatures detected in scoped regions.
        </p>
      </div>
    );
  }

  // aggregate
  const map = new Map<
    string,
    { original: string; replacement: string; count: number; contexts: Set<string> }
  >();
  for (const m of matches) {
    const key = m.original.toLowerCase();
    const prev = map.get(key);
    if (prev) {
      prev.count++;
      prev.contexts.add(m.context);
    } else {
      map.set(key, {
        original: m.original,
        replacement: m.replacement,
        count: 1,
        contexts: new Set([m.context]),
      });
    }
  }
  const rows = [...map.values()].sort((a, b) => b.count - a.count);

  return (
    <div className="panel rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/90">
          // threat_log
        </h3>
        <span className="font-mono text-[10px] text-rose-300/90">
          {matches.length} HIT{matches.length === 1 ? "" : "S"}
        </span>
      </div>
      <div className="terminal-scroll max-h-56 space-y-1.5 overflow-y-auto pr-1">
        {rows.map((row) => (
          <div
            key={row.original}
            className="flex items-center justify-between gap-2 rounded-md border border-slate-700/50 bg-slate-950/50 px-2.5 py-2 font-mono text-xs"
          >
            <div className="min-w-0 flex items-center gap-2">
              <span className="truncate text-rose-300/90 line-through decoration-rose-500/50">
                {row.original}
              </span>
              <span className="text-slate-600">→</span>
              <span className="truncate text-emerald-300/90">{row.replacement}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[10px]">
              <span className="text-slate-500">
                {[...row.contexts].join(",")}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">
                ×{row.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
