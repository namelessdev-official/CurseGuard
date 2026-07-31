import { useMemo } from "react";
import type { CensorMatch, CensorResult } from "../lib/censorEngine";

interface CodePanesProps {
  original: string;
  result: CensorResult | null;
}

export function CodePanes({ original, result }: CodePanesProps) {
  const originalHtml = useMemo(
    () => highlightMatches(original, result?.matches ?? [], "original"),
    [original, result]
  );
  const outputHtml = useMemo(
    () =>
      highlightReplacements(
        result?.output ?? "",
        result?.matches ?? []
      ),
    [result]
  );

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Pane
        title="INPUT_BUFFER"
        badge="RAW"
        badgeClass="text-amber-300 border-amber-500/30 bg-amber-500/10"
        html={originalHtml}
        empty={!original}
      />
      <Pane
        title="SANITIZED_OUTPUT"
        badge={result ? "SECURE" : "WAITING"}
        badgeClass={
          result
            ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
            : "text-slate-400 border-slate-600 bg-slate-800/50"
        }
        html={outputHtml}
        empty={!result}
      />
    </div>
  );
}

function Pane({
  title,
  badge,
  badgeClass,
  html,
  empty,
}: {
  title: string;
  badge: string;
  badgeClass: string;
  html: string;
  empty: boolean;
}) {
  return (
    <div className="panel flex min-h-[320px] flex-col overflow-hidden rounded-xl">
      <div className="flex items-center justify-between border-b border-slate-700/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </span>
          <span className="font-mono text-[11px] tracking-wider text-slate-400">
            {title}
          </span>
        </div>
        <span
          className={`rounded border px-1.5 py-0.5 font-mono text-[10px] ${badgeClass}`}
        >
          {badge}
        </span>
      </div>
      <div className="terminal-scroll relative flex-1 overflow-auto bg-[#0a0f18]/60 p-3">
        {empty ? (
          <div className="flex h-full min-h-[240px] items-center justify-center font-mono text-xs text-slate-600">
            {"// awaiting payload"}
          </div>
        ) : (
          <pre
            className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-slate-300"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 scanlines opacity-20" />
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlightMatches(
  text: string,
  matches: CensorMatch[],
  _kind: "original"
): string {
  if (!text) return "";
  if (matches.length === 0) return escapeHtml(text);

  const sorted = [...matches].sort((a, b) => a.index - b.index);
  let out = "";
  let cursor = 0;
  for (const m of sorted) {
    if (m.index < cursor) continue;
    out += escapeHtml(text.slice(cursor, m.index));
    const slice = text.slice(m.index, m.index + m.length);
    out += `<mark class="rounded-sm bg-rose-500/30 px-0.5 text-rose-200 ring-1 ring-rose-400/40" title="${escapeHtml(m.context)}">${escapeHtml(slice)}</mark>`;
    cursor = m.index + m.length;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}

/**
 * Highlight replacements in the output by scanning for replacement tokens
 * in order of matches (approximate — works well with preserveLength).
 */
function highlightReplacements(text: string, matches: CensorMatch[]): string {
  if (!text) return "";
  if (matches.length === 0) return escapeHtml(text);

  // Rebuild from original indices only works if lengths preserved.
  // Safer approach: walk output finding successive replacement strings.
  let out = "";
  let cursor = 0;
  let searchFrom = 0;
  for (const m of matches) {
    const idx = text.indexOf(m.replacement, searchFrom);
    if (idx === -1) continue;
    out += escapeHtml(text.slice(cursor, idx));
    out += `<mark class="rounded-sm bg-emerald-500/20 px-0.5 text-emerald-200 ring-1 ring-emerald-400/30" title="was: ${escapeHtml(m.original)}">${escapeHtml(m.replacement)}</mark>`;
    cursor = idx + m.replacement.length;
    searchFrom = cursor;
  }
  out += escapeHtml(text.slice(cursor));
  return out;
}
