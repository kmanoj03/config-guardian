// Since we are using a base rule check + gemini lookup ;
// The same issue might appear from rules and Gemini with different severities.
// Thus we write this piece of code to get a single clean item with the highest severity and dope explaination.

import type { Finding } from "../models/findings.js";

// Severity rank (higher is worse)
const ORDER: Record<Finding["severity"], number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  CRITICAL: 3,
};

// Normalize strings (collapse whitespace to dodge fake dupes)
const normTitle = (s?: string) =>
  (s || "").replace(/\s+/g, " ").trim().toLowerCase();

const normEvidence = (s?: string) =>
  (s || "").replace(/\s+/g, " ").trim().toLowerCase();

// A key that keeps distinct instances separate if evidence truly differs
const key = (x: Finding) => `${normTitle(x.title)}|${normEvidence(x.evidence)}`;

// Choose the richer (more informative) text
const richer = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return b.length > a.length ? b : a;
};

// Pick one lineRange: if only one present, use it; if both, keep the one with smaller span (more precise)
const pickLineRange = (a?: [number, number], b?: [number, number]) => {
  if (a && !b) return a;
  if (b && !a) return b;
  if (a && b) {
    const spanA = Math.abs(a[1] - a[0]);
    const spanB = Math.abs(b[1] - b[0]);
    return spanB < spanA ? b : a;
  }
  return undefined;
};

// Merge two findings that represent the same underlying issue
function mergeTwo(prev: Finding, cur: Finding): Finding {
  // 1) severity: higher wins
  const a = ORDER[prev.severity] >= ORDER[cur.severity] ? prev : cur;

  // 2) prefer LLM when severities tie (for copy polish), else keep winner `a`
  const preferLLM =
    ORDER[prev.severity] === ORDER[cur.severity] &&
    ((prev.source === "llm" && cur.source !== "llm") ||
      (cur.source === "llm" && prev.source !== "llm"));
  const winner = preferLLM ? (prev.source === "llm" ? prev : cur) : a;

  // 3) Build merged record, keeping the best of each field
  const merged: Finding = {
    ...winner,
    evidence: richer(
      winner.evidence,
      winner === prev ? cur.evidence : prev.evidence
    )!,
    rationale: richer(
      winner.rationale,
      winner === prev ? cur.rationale : prev.rationale
    )!,
    recommendation: richer(
      winner.recommendation,
      winner === prev ? cur.recommendation : prev.recommendation
    )!,
    lineRange: pickLineRange(prev.lineRange, cur.lineRange),
    // Source: if both present and tie, prefer LLM; otherwise keep winner’s or whichever exists
    source:
      prev.source && cur.source
        ? preferLLM
          ? "llm"
          : winner.source
        : winner.source || prev.source || cur.source,
  };

  // Keep an autofixHint if any one provides it (prefer winner’s, else the other)
  merged.autofixHint =
    merged.autofixHint ||
    (winner === prev ? cur.autofixHint : prev.autofixHint);

  return merged;
}

/**
 * Merge arrays:
 *  - one finding per issue (keyed by title|evidence)
 *  - higher severity wins; prefer LLM on ties
 *  - keep richer text; keep precise lineRange
 */
export function mergeFindings(a: Finding[], b: Finding[]): Finding[] {
  const map = new Map<string, Finding>();

  for (const src of [...a, ...b]) {
    const k = key(src);
    const existing = map.get(k);
    if (!existing) {
      map.set(k, src);
    } else {
      map.set(k, mergeTwo(existing, src));
    }
  }
  return Array.from(map.values());
}

/** Sort findings by severity (CRITICAL → LOW), then by title */
export function sortFindingsDesc(findings: Finding[]): Finding[] {
  return [...findings].sort((x, y) => {
    const sev = ORDER[y.severity] - ORDER[x.severity];
    if (sev !== 0) return sev;
    const tx = normTitle(x.title);
    const ty = normTitle(y.title);
    return tx < ty ? -1 : tx > ty ? 1 : 0;
  });
}
