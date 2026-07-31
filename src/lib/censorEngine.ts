import { buildProfanityRegex } from "./wordList";

export type FileMode = "code" | "text" | "auto";

export type CensorStyle = "asterisks" | "grawlix" | "redacted" | "hash";

export interface CensorOptions {
  /** code = strings/comments only; text = full document; auto = by extension */
  mode: FileMode;
  style: CensorStyle;
  /** Preserve original character length when replacing */
  preserveLength: boolean;
  /** Enable leetspeak / separator matching (text mode leans on this) */
  aggressive: boolean;
  fileName?: string;
}

export interface CensorMatch {
  original: string;
  replacement: string;
  index: number;
  length: number;
  context: "string" | "comment" | "text" | "attribute";
}

export interface CensorResult {
  output: string;
  matches: CensorMatch[];
  mode: "code" | "text";
  fileName: string;
  stats: {
    totalMatches: number;
    uniqueWords: number;
    charactersRedacted: number;
    regionsScanned: number;
  };
}

const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "html",
  "htm",
  "xhtml",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "jsonc",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "kts",
  "c",
  "h",
  "cpp",
  "cc",
  "cxx",
  "hpp",
  "cs",
  "php",
  "swift",
  "m",
  "mm",
  "sql",
  "sh",
  "bash",
  "zsh",
  "ps1",
  "yml",
  "yaml",
  "toml",
  "xml",
  "svg",
  "vue",
  "svelte",
  "astro",
  "dart",
  "lua",
  "r",
  "pl",
  "pm",
  "scala",
  "clj",
  "ex",
  "exs",
  "hs",
  "elm",
  "erl",
  "vim",
  "dockerfile",
  "makefile",
  "cmake",
  "gradle",
  "groovy",
  "tf",
  "hcl",
  "ini",
  "cfg",
  "conf",
  "env",
  "properties",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "mdx",
  "rst",
  "text",
  "log",
  "csv",
  "tsv",
  "rtf",
  "org",
  "adoc",
  "asciidoc",
  "nfo",
  "readme",
]);

export function detectMode(fileName?: string): "code" | "text" {
  if (!fileName) return "text";
  const base = fileName.split(/[/\\]/).pop() ?? fileName;
  const lower = base.toLowerCase();

  // extensionless special names
  if (
    lower === "dockerfile" ||
    lower === "makefile" ||
    lower === "jenkinsfile" ||
    lower === "vagrantfile" ||
    lower === "gemfile" ||
    lower === "rakefile" ||
    lower === "procfile"
  ) {
    return "code";
  }

  const dot = lower.lastIndexOf(".");
  const ext = dot >= 0 ? lower.slice(dot + 1) : "";

  if (TEXT_EXTENSIONS.has(ext)) return "text";
  if (CODE_EXTENSIONS.has(ext)) return "code";

  // unknown: treat as text so we still scrub content
  return "text";
}

const GRAWLIX = ["@", "#", "$", "%", "&", "*", "!", "?"];

export function maskWord(
  word: string,
  style: CensorStyle,
  preserveLength: boolean
): string {
  if (!word) return word;

  // Keep pure whitespace as-is inside a match (shouldn't happen often)
  if (/^\s+$/.test(word)) return word;

  const len = word.length;

  switch (style) {
    case "redacted":
      if (preserveLength) {
        return "█".repeat(Math.max(len, 1));
      }
      return "[REDACTED]";
    case "hash": {
      // stable short hash-like token
      let h = 0;
      for (let i = 0; i < word.length; i++) {
        h = (Math.imul(31, h) + word.charCodeAt(i)) | 0;
      }
      const hex = (h >>> 0).toString(16).padStart(8, "0");
      if (preserveLength) {
        const token = `§${hex}`;
        if (token.length >= len) return token.slice(0, len);
        return token + "•".repeat(len - token.length);
      }
      return `§${hex}`;
    }
    case "grawlix": {
      if (!preserveLength && len <= 2) return "**";
      let out = "";
      for (let i = 0; i < len; i++) {
        const ch = word[i];
        if (/\s/.test(ch)) {
          out += ch;
        } else if (i === 0 && /[a-zA-Z]/.test(ch) && len > 3) {
          // optionally keep first letter vibe — actually full mask for security theme
          out += GRAWLIX[i % GRAWLIX.length];
        } else {
          out += GRAWLIX[(i + ch.charCodeAt(0)) % GRAWLIX.length];
        }
      }
      return out;
    }
    case "asterisks":
    default: {
      if (!preserveLength) {
        if (len <= 2) return "**";
        // keep first char lightly obscured for readability of structure
        return "*".repeat(len);
      }
      return word
        .split("")
        .map((ch) => (/\s/.test(ch) ? ch : "*"))
        .join("");
    }
  }
}

interface Region {
  start: number;
  end: number;
  context: CensorMatch["context"];
}

/**
 * Extract safe-to-censor regions from source code:
 * strings, comments, and HTML text/attributes values.
 * Code identifiers and keywords are left untouched.
 */
export function extractCodeRegions(source: string): Region[] {
  const regions: Region[] = [];
  const n = source.length;
  let i = 0;

  const push = (start: number, end: number, context: Region["context"]) => {
    if (end > start) regions.push({ start, end, context });
  };

  while (i < n) {
    const c = source[i];
    const next = i + 1 < n ? source[i + 1] : "";

    // Line comment //
    if (c === "/" && next === "/") {
      const start = i;
      i += 2;
      while (i < n && source[i] !== "\n") i++;
      push(start, i, "comment");
      continue;
    }

    // Block comment /* */
    if (c === "/" && next === "*") {
      const start = i;
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i = Math.min(n, i + 2);
      push(start, i, "comment");
      continue;
    }

    // HTML / XML comment <!-- -->
    if (c === "<" && source.startsWith("<!--", i)) {
      const start = i;
      const endIdx = source.indexOf("-->", i + 4);
      i = endIdx === -1 ? n : endIdx + 3;
      push(start, i, "comment");
      continue;
    }

    // Hash comment (python, ruby, shells, yaml) — only if at bol or after whitespace
    if (c === "#") {
      const prev = i > 0 ? source[i - 1] : "\n";
      if (prev === "\n" || prev === "\r" || /\s/.test(prev) || i === 0) {
        // avoid CSS colors like #fff mid-token — require start-ish
        const start = i;
        i += 1;
        while (i < n && source[i] !== "\n") i++;
        push(start, i, "comment");
        continue;
      }
    }

    // Double-quoted string
    if (c === '"') {
      const start = i;
      i++;
      while (i < n) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === '"') {
          i++;
          break;
        }
        // raw newlines allowed in some langs — still keep scanning
        i++;
      }
      push(start, i, "string");
      continue;
    }

    // Single-quoted string
    if (c === "'") {
      const start = i;
      i++;
      while (i < n) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      push(start, i, "string");
      continue;
    }

    // Template literal `...` with ${} holes skipped for inner code
    if (c === "`") {
      const start = i;
      i++;
      let regionStart = start;
      while (i < n) {
        if (source[i] === "\\") {
          i += 2;
          continue;
        }
        if (source[i] === "`") {
          i++;
          push(regionStart, i, "string");
          break;
        }
        // ${ expression } — close string region, skip expression carefully
        if (source[i] === "$" && source[i + 1] === "{") {
          push(regionStart, i, "string");
          i += 2;
          let depth = 1;
          while (i < n && depth > 0) {
            // nested strings inside ${}
            const ch = source[i];
            if (ch === "'" || ch === '"' || ch === "`") {
              const q = ch;
              i++;
              while (i < n) {
                if (source[i] === "\\") {
                  i += 2;
                  continue;
                }
                if (source[i] === q) {
                  i++;
                  break;
                }
                i++;
              }
              continue;
            }
            if (ch === "{") depth++;
            else if (ch === "}") depth--;
            if (depth === 0) break;
            i++;
          }
          if (i < n && source[i] === "}") i++;
          regionStart = i;
          continue;
        }
        i++;
      }
      continue;
    }

    // HTML/XML tags: scan attribute values and text nodes roughly
    if (c === "<" && /[a-zA-Z/!?]/.test(next)) {
      // If it's a closing or opening tag, walk attributes
      const tagStart = i;
      i++; // <
      const isClose = source[i] === "/";
      if (isClose) i++;
      // skip bang/doctype/pi lightly
      while (i < n && /[a-zA-Z0-9:_-]/.test(source[i])) i++;

      // attributes
      while (i < n && source[i] !== ">") {
        if (source[i] === "/" && source[i + 1] === ">") {
          i += 2;
          break;
        }
        // whitespace
        if (/\s/.test(source[i])) {
          i++;
          continue;
        }
        // attr name
        while (i < n && /[a-zA-Z0-9:_-]/.test(source[i])) i++;
        while (i < n && /\s/.test(source[i])) i++;
        if (source[i] === "=") {
          i++;
          while (i < n && /\s/.test(source[i])) i++;
          if (source[i] === '"' || source[i] === "'") {
            const q = source[i];
            const aStart = i;
            i++;
            while (i < n && source[i] !== q) {
              if (source[i] === "\\") {
                i += 2;
                continue;
              }
              i++;
            }
            if (i < n) i++;
            push(aStart, i, "attribute");
          } else {
            // unquoted attr
            const aStart = i;
            while (i < n && !/[\s>]/.test(source[i])) i++;
            push(aStart, i, "attribute");
          }
        } else if (source[i] !== ">") {
          // weird char, advance
          i++;
        }
      }
      if (i < n && source[i] === ">") i++;

      // After a tag, if not script/style special, text nodes handled by general scan —
      // we additionally mark free text between tags as text regions via a second pass.
      void tagStart;
      continue;
    }

    i++;
  }

  // Second pass: HTML text nodes between tags (only when file looks like markup)
  if (/<\/?[a-zA-Z]/.test(source)) {
    const textRegions = extractHtmlTextNodes(source);
    for (const r of textRegions) {
      // avoid overlapping existing regions
      if (!regions.some((e) => r.start < e.end && r.end > e.start)) {
        regions.push(r);
      }
    }
  }

  regions.sort((a, b) => a.start - b.start);
  return mergeRegions(regions);
}

function extractHtmlTextNodes(source: string): Region[] {
  const regions: Region[] = [];
  const re = /<\/?(?:script|style|textarea)[\s>]/gi;
  // Simple approach: text between > and <
  let i = 0;
  const n = source.length;
  while (i < n) {
    if (source[i] === "<") {
      // skip tag
      if (source.startsWith("<!--", i)) {
        const end = source.indexOf("-->", i + 4);
        i = end === -1 ? n : end + 3;
        continue;
      }
      // script/style: skip content entirely for structure (their strings handled if quoted in JS extract —
      // but raw JS in script may need full code scan). For safety, run code region extractor logic
      // already covered strings/comments. Skip raw script body identifiers by not marking as text.
      const tagMatch = source.slice(i).match(/^<\s*(\/?)\s*([a-zA-Z0-9]+)/);
      if (tagMatch) {
        const isClose = tagMatch[1] === "/";
        const name = tagMatch[2].toLowerCase();
        const closeAngle = source.indexOf(">", i);
        if (closeAngle === -1) break;
        i = closeAngle + 1;
        if (
          !isClose &&
          (name === "script" || name === "style" || name === "textarea")
        ) {
          const closeTag = new RegExp(`<\\/\\s*${name}\\s*>`, "i");
          const rest = source.slice(i);
          const m = rest.search(closeTag);
          if (name === "script") {
            // parse script body as code regions
            const body = m === -1 ? rest : rest.slice(0, m);
            const inner = extractCodeRegions(body).map((r) => ({
              start: r.start + i,
              end: r.end + i,
              context: r.context,
            }));
            regions.push(...inner);
          }
          // style: only comments and strings
          if (name === "style") {
            const body = m === -1 ? rest : rest.slice(0, m);
            const inner = extractCodeRegions(body).map((r) => ({
              start: r.start + i,
              end: r.end + i,
              context: r.context,
            }));
            regions.push(...inner);
          }
          if (m === -1) break;
          const close = rest.slice(m).match(closeTag);
          i = i + m + (close ? close[0].length : 0);
          continue;
        }
        continue;
      }
      const closeAngle = source.indexOf(">", i);
      i = closeAngle === -1 ? n : closeAngle + 1;
      continue;
    }
    // text node
    const start = i;
    while (i < n && source[i] !== "<") i++;
    const chunk = source.slice(start, i);
    if (chunk.trim().length > 0) {
      regions.push({ start, end: i, context: "text" });
    }
  }
  void re;
  return regions;
}

function mergeRegions(regions: Region[]): Region[] {
  if (regions.length === 0) return [];
  const sorted = [...regions].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Region[] = [];
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= cur.end) {
      // merge overlap; prefer more specific context
      cur.end = Math.max(cur.end, r.end);
    } else {
      out.push(cur);
      cur = { ...r };
    }
  }
  out.push(cur);
  return out;
}

function censorInText(
  text: string,
  baseIndex: number,
  context: CensorMatch["context"],
  regex: RegExp,
  style: CensorStyle,
  preserveLength: boolean
): { text: string; matches: CensorMatch[] } {
  const matches: CensorMatch[] = [];
  // Reset regex
  const re = new RegExp(regex.source, regex.flags);
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const original = m[0];
    const trimmed = original.trim();
    // Skip ultra-short false positives except known short profanity
    if (trimmed.length < 3 && !/^(ass|fag)$/i.test(trimmed)) {
      continue;
    }
    const replacement = maskWord(original, style, preserveLength);
    out += text.slice(last, m.index);
    out += replacement;
    matches.push({
      original,
      replacement,
      index: baseIndex + m.index,
      length: original.length,
      context,
    });
    last = m.index + original.length;
    // prevent zero-length loops
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  out += text.slice(last);
  return { text: out, matches };
}

export function censorContent(
  input: string,
  options: CensorOptions
): CensorResult {
  const fileName = options.fileName ?? "untitled.txt";
  const resolved: "code" | "text" =
    options.mode === "auto" ? detectMode(fileName) : options.mode === "code" ? "code" : "text";

  const aggressive =
    options.aggressive || resolved === "text";
  const regex = buildProfanityRegex(aggressive);

  const allMatches: CensorMatch[] = [];
  let output: string;
  let regionsScanned = 0;

  if (resolved === "text") {
    regionsScanned = 1;
    const result = censorInText(
      input,
      0,
      "text",
      regex,
      options.style,
      options.preserveLength
    );
    output = result.text;
    allMatches.push(...result.matches);
  } else {
    const regions = extractCodeRegions(input);
    regionsScanned = regions.length;
    if (regions.length === 0) {
      // No string/comment regions found — do not touch identifiers.
      // Fall back: only scan obvious quoted patterns already none.
      output = input;
    } else {
      let cursor = 0;
      const pieces: string[] = [];
      for (const region of regions) {
        pieces.push(input.slice(cursor, region.start));
        const slice = input.slice(region.start, region.end);
        const result = censorInText(
          slice,
          region.start,
          region.context,
          regex,
          options.style,
          options.preserveLength
        );
        pieces.push(result.text);
        allMatches.push(...result.matches);
        cursor = region.end;
      }
      pieces.push(input.slice(cursor));
      output = pieces.join("");
    }
  }

  const unique = new Set(allMatches.map((m) => m.original.toLowerCase()));
  const charactersRedacted = allMatches.reduce((a, m) => a + m.length, 0);

  return {
    output,
    matches: allMatches,
    mode: resolved,
    fileName,
    stats: {
      totalMatches: allMatches.length,
      uniqueWords: unique.size,
      charactersRedacted,
      regionsScanned,
    },
  };
}

export function getLanguageLabel(fileName: string): string {
  const mode = detectMode(fileName);
  const ext = (fileName.split(".").pop() ?? "").toLowerCase();
  if (mode === "text") {
    if (ext === "md" || ext === "markdown" || ext === "mdx") return "Markdown";
    if (ext === "txt") return "Plain text";
    return "Text";
  }
  const map: Record<string, string> = {
    js: "JavaScript",
    jsx: "JavaScript (JSX)",
    ts: "TypeScript",
    tsx: "TypeScript (TSX)",
    html: "HTML",
    htm: "HTML",
    css: "CSS",
    scss: "SCSS",
    json: "JSON",
    py: "Python",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    java: "Java",
    php: "PHP",
    sh: "Shell",
    yml: "YAML",
    yaml: "YAML",
    xml: "XML",
    sql: "SQL",
    vue: "Vue",
    svelte: "Svelte",
  };
  return map[ext] ?? `Code (.${ext || "?"})`;
}
