import type { ReactNode } from "react";
import type { CensorStyle, FileMode } from "../lib/censorEngine";

export interface ControlState {
  mode: FileMode;
  style: CensorStyle;
  preserveLength: boolean;
  aggressive: boolean;
}

interface ControlsProps {
  value: ControlState;
  onChange: (next: ControlState) => void;
}

export function Controls({ value, onChange }: ControlsProps) {
  const set = <K extends keyof ControlState>(key: K, v: ControlState[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="panel rounded-xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/90">
          // protocol_config
        </h2>
        <span className="font-mono text-[10px] text-slate-500">TUNABLE</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Scan profile">
          <Segmented
            value={value.mode}
            onChange={(mode) => set("mode", mode as FileMode)}
            options={[
              { id: "auto", label: "AUTO" },
              { id: "code", label: "CODE" },
              { id: "text", label: "TEXT" },
            ]}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
            CODE only scrubs strings, comments & HTML text — identifiers stay
            valid. TEXT applies full-document scrub (Markdown / .txt).
          </p>
        </Field>

        <Field label="Redaction style">
          <Segmented
            value={value.style}
            onChange={(style) => set("style", style as CensorStyle)}
            options={[
              { id: "asterisks", label: "***" },
              { id: "grawlix", label: "@#$" },
              { id: "redacted", label: "█" },
              { id: "hash", label: "§HASH" },
            ]}
          />
        </Field>

        <Toggle
          label="Preserve length"
          hint="Keep original token width so diffs & layout stay stable"
          checked={value.preserveLength}
          onChange={(preserveLength) => set("preserveLength", preserveLength)}
        />

        <Toggle
          label="Aggressive matching"
          hint="Leetspeak & f-u-c-k separators. Auto-on for text profiles."
          checked={value.aggressive}
          onChange={(aggressive) => set("aggressive", aggressive)}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
        {label}
      </div>
      {children}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-slate-700/80 bg-slate-950/80 p-1">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`min-w-0 flex-1 rounded-md px-2 py-1.5 font-mono text-[11px] transition ${
              active
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/40"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 rounded-lg border border-slate-700/60 bg-slate-950/50 p-3 text-left transition hover:border-slate-600"
    >
      <span
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${
          checked ? "bg-emerald-500/80" : "bg-slate-700"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow transition ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      <span>
        <span className="block text-sm text-slate-200">{label}</span>
        <span className="mt-0.5 block text-[11px] text-slate-500">{hint}</span>
      </span>
    </button>
  );
}
