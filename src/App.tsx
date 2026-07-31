import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Header } from "./components/Header";
import { DropZone } from "./components/DropZone";
import { Controls, type ControlState } from "./components/Controls";
import { StatsBar } from "./components/StatsBar";
import { FileTabs, type FileEntry } from "./components/FileTabs";
import { CodePanes } from "./components/CodePanes";
import { MatchList } from "./components/MatchList";
import { SampleBar } from "./components/SampleBar";
import {
  censorContent,
  getLanguageLabel,
  type CensorResult,
} from "./lib/censorEngine";

let fileSeq = 0;
function uid() {
  fileSeq += 1;
  return `f-${Date.now()}-${fileSeq}`;
}

export default function App() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [controls, setControls] = useState<ControlState>({
    mode: "auto",
    style: "asterisks",
    preserveLength: true,
    aggressive: false,
  });
  const [pasteValue, setPasteValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const active = files.find((f) => f.id === activeId) ?? files[0] ?? null;

  const results = useMemo(() => {
    const map: Record<string, CensorResult> = {};
    for (const f of files) {
      map[f.id] = censorContent(f.content, {
        mode: controls.mode,
        style: controls.style,
        preserveLength: controls.preserveLength,
        aggressive: controls.aggressive,
        fileName: f.name,
      });
    }
    return map;
  }, [files, controls]);

  const activeResult = active ? results[active.id] ?? null : null;

  const matchCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const [id, r] of Object.entries(results)) {
      m[id] = r.stats.totalMatches;
    }
    return m;
  }, [results]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const addFile = useCallback((name: string, content: string) => {
    const entry: FileEntry = {
      id: uid(),
      name,
      content,
      size: content.length,
    };
    setFiles((prev) => [...prev, entry]);
    setActiveId(entry.id);
    return entry.id;
  }, []);

  const onFiles = useCallback(
    async (list: File[]) => {
      setProcessing(true);
      try {
        for (const file of list) {
          const text = await file.text();
          addFile(file.name, text);
        }
        showToast(
          `Ingested ${list.length} file${list.length === 1 ? "" : "s"} into quarantine buffer`
        );
      } finally {
        setProcessing(false);
      }
    },
    [addFile]
  );

  const onLoadSample = (name: string, content: string) => {
    addFile(name, content);
    showToast(`Loaded demo target: ${name}`);
  };

  const onPasteIngest = () => {
    if (!pasteValue.trim()) return;
    const name = `paste-${Date.now()}.txt`;
    addFile(name, pasteValue);
    setPasteValue("");
    showToast("Clipboard payload ingested");
  };

  const closeFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const downloadActive = () => {
    if (!active || !activeResult) return;
    const blob = new Blob([activeResult.output], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const base = active.name.replace(/(\.[^.]+)?$/, (m) => `.clean${m || ".txt"}`);
    a.href = url;
    a.download = base;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${base}`);
  };

  const copyActive = async () => {
    if (!activeResult) return;
    try {
      await navigator.clipboard.writeText(activeResult.output);
      showToast("Sanitized output copied to clipboard");
    } catch {
      showToast("Clipboard write blocked by browser");
    }
  };

  const downloadAll = () => {
    const entries = Object.values(results);
    if (entries.length === 0) return;
    // single bundle as concatenated with headers if multiple
    if (entries.length === 1) {
      downloadActive();
      return;
    }
    const bundle = entries
      .map(
        (r) =>
          `${"=".repeat(60)}\n// FILE: ${r.fileName} | mode=${r.mode} | hits=${r.stats.totalMatches}\n${"=".repeat(60)}\n${r.output}\n`
      )
      .join("\n");
    const blob = new Blob([bundle], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `curseguard-bundle-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported multi-file bundle");
  };

  // subtle processing flash when controls change with files present
  useEffect(() => {
    if (files.length === 0) return;
    setProcessing(true);
    const t = window.setTimeout(() => setProcessing(false), 180);
    return () => clearTimeout(t);
  }, [controls, files.length]);

  return (
    <div className="grid-bg relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 scanlines opacity-25" />
      <Header />

      <main className="relative z-10 mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Hero strip */}
        <section className="animate-slide-up panel relative overflow-hidden rounded-2xl p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Air-gapped client-side scrubber
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Sanitize NSFW language{" "}
                <span className="text-glow text-cyan-300">without breaking code</span>
              </h2>
              <p className="text-sm leading-relaxed text-slate-400 sm:text-[15px]">
                CurseGuard inspects uploads locally in your browser. For source
                files it only rewrites string literals, comments, and markup
                text/attributes — leaving identifiers, APIs, and syntax intact.
                Markdown and plain text get a fuller pass with aggressive
                obfuscation matching.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-[11px] text-slate-400">
              <FeatureChip>STRING-SAFE</FeatureChip>
              <FeatureChip>COMMENT-AWARE</FeatureChip>
              <FeatureChip>HTML TEXT NODES</FeatureChip>
              <FeatureChip>ZERO UPLOAD</FeatureChip>
            </div>
          </div>
        </section>

        <StatsBar
          result={activeResult}
          fileCount={files.length}
          processing={processing}
        />

        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <DropZone onFiles={onFiles} disabled={processing} />
            <Controls value={controls} onChange={setControls} />
            <SampleBar onLoad={onLoadSample} />

            <div className="panel rounded-xl p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
                  // raw_inject
                </h2>
              </div>
              <textarea
                value={pasteValue}
                onChange={(e) => setPasteValue(e.target.value)}
                placeholder="Paste hostile text or code snippet…"
                rows={5}
                className="w-full resize-y rounded-lg border border-slate-700/80 bg-slate-950/80 p-3 font-mono text-xs text-slate-200 outline-none ring-cyan-500/30 placeholder:text-slate-600 focus:ring-2"
              />
              <button
                type="button"
                onClick={onPasteIngest}
                disabled={!pasteValue.trim()}
                className="mt-2 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 font-mono text-xs text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                INGEST_PASTE
              </button>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <FileTabs
                files={files}
                activeId={active?.id ?? null}
                onSelect={setActiveId}
                onClose={closeFile}
                matchCounts={matchCounts}
              />
              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  onClick={copyActive}
                  disabled={!activeResult}
                  label="COPY"
                />
                <ActionBtn
                  onClick={downloadActive}
                  disabled={!activeResult}
                  label="EXPORT"
                />
                <ActionBtn
                  onClick={downloadAll}
                  disabled={files.length === 0}
                  label="EXPORT_ALL"
                  primary
                />
              </div>
            </div>

            {active && (
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-slate-500">
                <span>
                  TARGET:{" "}
                  <span className="text-slate-300">{active.name}</span>
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  LANG:{" "}
                  <span className="text-cyan-300/90">
                    {getLanguageLabel(active.name)}
                  </span>
                </span>
                <span className="text-slate-700">|</span>
                <span>
                  BYTES:{" "}
                  <span className="text-slate-300">{active.size}</span>
                </span>
                {activeResult && (
                  <>
                    <span className="text-slate-700">|</span>
                    <span>
                      PROFILE:{" "}
                      <span className="text-violet-300">
                        {activeResult.mode.toUpperCase()}
                      </span>
                    </span>
                  </>
                )}
              </div>
            )}

            <CodePanes
              original={active?.content ?? ""}
              result={activeResult}
            />

            <MatchList matches={activeResult?.matches ?? []} />

            <section className="panel rounded-xl p-4 sm:p-5">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/90">
                // security_model
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <InfoCard
                  title="Code profile"
                  body="Tokenizer-style scan isolates // /* */ # comments, quoted strings, template literals (skipping ${} holes), HTML attributes, and text nodes. Identifiers like assholeMode remain compilable."
                />
                <InfoCard
                  title="Text profile"
                  body="Markdown, .txt, and logs get whole-document scrubbing with leetspeak & separator-aware matching — less worried about breaking syntax."
                />
                <InfoCard
                  title="Privacy"
                  body="All processing is local. Nothing leaves this tab. Export only writes a cleaned file to your machine."
                />
              </div>
            </section>
          </div>
        </div>

        <footer className="border-t border-slate-800/80 pt-6 pb-8 text-center font-mono text-[11px] text-slate-600">
          CURSEGUARD · CLIENT-SIDE CONTENT FIREWALL · NO TELEMETRY · EN-US LEXICON
        </footer>
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-lg border border-cyan-500/30 bg-slate-950/95 px-4 py-2.5 font-mono text-xs text-cyan-100 shadow-lg shadow-cyan-950/50 glow-cyan">
          {toast}
        </div>
      )}
    </div>
  );
}

function FeatureChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-slate-700/80 bg-slate-900/80 px-2 py-1 text-slate-400">
      {children}
    </span>
  );
}

function ActionBtn({
  label,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
        primary
          ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
          : "border-slate-600 bg-slate-900 text-slate-300 hover:border-slate-500 hover:bg-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-950/40 p-3">
      <div className="text-sm font-medium text-slate-200">{title}</div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
