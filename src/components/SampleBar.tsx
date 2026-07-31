import { SAMPLE_FILES } from "../lib/samples";

interface SampleBarProps {
  onLoad: (name: string, content: string) => void;
}

export function SampleBar({ onLoad }: SampleBarProps) {
  return (
    <div className="panel rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
          // training_targets
        </h2>
        <span className="font-mono text-[10px] text-slate-500">DEMO PAYLOADS</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SAMPLE_FILES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onLoad(s.name, s.content)}
            className="group rounded-lg border border-slate-700/80 bg-slate-950/70 px-3 py-2 text-left transition hover:border-cyan-500/40 hover:bg-cyan-500/5"
          >
            <div className="font-mono text-xs text-slate-200 group-hover:text-cyan-200">
              {s.name}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{s.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
