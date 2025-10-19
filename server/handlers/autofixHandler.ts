import { Storage } from "./storage.js";
import { buildUnifiedDiff } from "../utils/diff.js";
import {
  AUTOFIX_PROMPT,
  AUTOFIX_PROMPT_MINIMAL_RETRY,
  AUTOFIX_REPAIR_TO_PLAINTEXT,
} from "../utils/prompts.js";
import { geminiGeneratePlain } from "./gemini.js";
import type { Finding } from "../models/findings.js";

/* ----------------------------- helpers ----------------------------- */

// Clean model output to plain multiline text
function sanitizePatchedText(s: string): string {
  let out = (s ?? "").trim();

  // strip accidental markdown fences
  out = out
    .replace(/^\s*```[a-z]*\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // if it's one giant quoted string, unquote + unescape
  const isQuoted =
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"));
  if (isQuoted) {
    out = out.slice(1, -1);
    out = out
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'")
      .replace(/\\\\/g, "\\");
  }

  return out.trim();
}

// Detect if model returned JSON / JSON Patch instead of plain text
function looksStructuredPatch(s: string): boolean {
  const t = (s ?? "").trim();
  return (
    t.startsWith("[") ||
    t.startsWith("{") ||
    /"op"\s*:\s*"(add|remove|replace|move|copy|test)"/i.test(t)
  );
}

// Disallow sneaky bloat unless a finding explicitly permits it
function isDisallowedLine(line: string): boolean {
  const L = line.trim().toLowerCase();
  return (
    /^label\s+/.test(L) ||
    /\bapt-get\s+install\b/.test(L) ||
    /\bapk\s+add\b/.test(L) ||
    /\byum\s+install\b/.test(L)
  );
}

function findingsAllowPackagesOrLabels(findings: Finding[]): boolean {
  const blob = JSON.stringify(findings).toLowerCase();
  // Soften this if you later add explicit "allow" metadata to findings
  return /healthcheck.+requires.+curl|install.+package|label/.test(blob);
}

// If not allowed, strip lines that add packages/labels. Return ok=false if we stripped anything.
function stripDisallowedIfNeeded(
  patched: string,
  findings: Finding[]
): { ok: boolean; text: string } {
  if (findingsAllowPackagesOrLabels(findings)) {
    return { ok: true, text: patched };
  }
  const lines = patched.split(/\r?\n/);
  const kept = lines.filter((l) => !isDisallowedLine(l));
  const changed = kept.length !== lines.length;
  return { ok: !changed, text: kept.join("\n").trim() };
}

/**
 * Normalize Node base images deterministically:
 *  - First `FROM node:*` → `FROM node:<ver> AS builder`
 *  - Subsequent `FROM node:*` → `FROM node:<ver>-slim`
 * Non-Node images are left untouched. Preserves other lines verbatim.
 */
function normalizeNodeBaseImages(patched: string): string {
  const VERSION = process.env.NODE_BASE_VERSION || "22.0.0";
  const lines = patched.split(/\r?\n/);
  let fromNodeCount = 0;

  const rewritten = lines.map((line) => {
    const m = line.match(
      /^\s*FROM\s+node:([^\s]+)(?:\s+AS\s+([A-Za-z0-9_-]+))?\s*$/i
    );
    if (!m) return line; // not a FROM node line

    fromNodeCount += 1;
    if (fromNodeCount === 1) {
      // Builder stage
      return `FROM node:${VERSION} AS builder`;
    } else {
      // Runtime stage(s)
      // Preserve an existing alias if present (rare for runtime, but safe)
      const alias = m[2] ? ` AS ${m[2]}` : "";
      return `FROM node:${VERSION}-slim${alias}`;
    }
  });

  return rewritten.join("\n");
}

/* ------------------------------ handler ------------------------------ */

export async function autofixTask(id: string) {
  const task = Storage.get(id);
  if (!task) return { status: 404, error: "not found" } as const;

  const original = task.input.text;
  if (!original) {
    return {
      status: 400,
      error:
        "original text required (image OCR not patched yet). Provide text.",
    } as const;
  }

  const findings: Finding[] = task.findings || [];
  if (!findings.length) {
    return {
      status: 400,
      error: "no findings on task; run analyze first",
    } as const;
  }

  try {
    const findingsJson = JSON.stringify({ fileType: task.fileType, findings });

    // 1) Ask for the final file as plain text (no JSON, no fences)
    let patched = await geminiGeneratePlain(
      AUTOFIX_PROMPT(task.fileType, original, findingsJson)
    );
    patched = sanitizePatchedText(patched);

    // 2) If the model still returned structured ops, repair into plaintext once
    if (looksStructuredPatch(patched)) {
      const repaired = await geminiGeneratePlain(
        AUTOFIX_REPAIR_TO_PLAINTEXT(original, patched)
      );
      patched = sanitizePatchedText(repaired);
    }

    // 3) Final guard: if it STILL looks like JSON/ops, bail clearly
    if (looksStructuredPatch(patched)) {
      return {
        status: 502,
        error: "autofix_bad_format",
        detail:
          "Model returned structured patch instead of file text after repair. Please retry.",
      } as const;
    }

    // 4) Enforce minimalism: remove labels/package installs unless allowed by findings
    const minimal = stripDisallowedIfNeeded(patched, findings);
    if (!minimal.ok) {
      // 4a) Retry with a stricter prompt
      let retryText = await geminiGeneratePlain(
        AUTOFIX_PROMPT_MINIMAL_RETRY(task.fileType, original, findingsJson)
      );
      retryText = sanitizePatchedText(retryText);

      // 4b) If retry still structured, repair again
      if (looksStructuredPatch(retryText)) {
        const repairedRetry = await geminiGeneratePlain(
          AUTOFIX_REPAIR_TO_PLAINTEXT(original, retryText)
        );
        retryText = sanitizePatchedText(repairedRetry);
      }

      // 4c) As a last resort, hard strip disallowed lines
      const minimalRetry = stripDisallowedIfNeeded(retryText, findings);
      patched = minimalRetry.text;
    } else {
      patched = minimal.text;
    }

    // 4d) Normalize Node base images consistently (env-driven; default 22.0.0)
    patched = normalizeNodeBaseImages(patched);

    // 5) Build unified diff (3-line context)
    const diff = buildUnifiedDiff(task.fileType, original, patched);

    Storage.update(task.id, {
      state: "PATCHED",
      patchDiff: diff,
      patchedText: patched,
    });

    return { status: 200, diff } as const;
  } catch (e: any) {
    return {
      status: 500,
      error: "autofix_failed",
      detail: e?.message,
    } as const;
  }
}
