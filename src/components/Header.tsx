export function Header() {
  return (
    <header className="relative border-b border-cyan-500/15 bg-slate-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-emerald-500/10 ring-1 ring-cyan-400/40">
            <svg
              viewBox="0 0 32 32"
              className="h-6 w-6 text-cyan-300"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M16 3L5 8v7c0 7.2 4.7 12.4 11 14 6.3-1.6 11-6.8 11-14V8L16 3z"
                strokeLinejoin="round"
              />
              <path d="M11 16l3.2 3.2L21 12.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 22h14" strokeLinecap="round" opacity="0.45" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
                Curse<span className="text-cyan-300">Guard</span>
              </h1>
              <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-300/90">
                v2.4.0
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-400 sm:text-xs">
              SECURE_CONTENT_SANITIZER // CODE-AWARE NSFW FILTER
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-400">
          <StatusPill label="ENGINE" value="ONLINE" ok />
          <StatusPill label="LEXICON" value="EN-US" />
          <StatusPill label="MODE" value="LOCAL" />
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-700/80 bg-slate-900/80 px-2.5 py-1">
      <span className="text-slate-500">{label}</span>
      <span className={ok ? "text-emerald-400" : "text-cyan-300"}>{value}</span>
      {ok && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
      )}
    </div>
  );
}
