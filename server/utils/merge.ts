// Since we are using a base rule check + gemini lookup ;
// The same issue might appear from rules and Gemini with different severities.
// Thus we write this piece of code to get a single clean item with the highest severity and dope explaination.

import type { Finding } from "./rules.js";

const order = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 } as const;
const key = (x: Finding) => (x.title + "|" + (x.evidence || "")).toLowerCase();
const preferRicher = (a?: string, b?: string) => {
  if (!a) return b;
  if (!b) return a;
  return b.length > a.length ? b : a;
};

export function mergeFindings(a: Finding[], b: Finding[]): Finding[] {
  const map = new Map<string, Finding>();
  for (const src of [...a, ...b]) {
    const k = key(src);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, src);
      continue;
    }

    const keepHigh = order[src.severity] > order[prev.severity] ? src : prev;
    keepHigh.rationale = preferRicher(keepHigh.rationale, prev.rationale)!;
    keepHigh.recommendation = preferRicher(
      keepHigh.recommendation,
      prev.recommendation
    )!;
    keepHigh.evidence = preferRicher(keepHigh.evidence, prev.evidence)!;
    keepHigh.lineRange ||= prev.lineRange;
    keepHigh.source =
      prev.source === "rule" || src.source === "rule"
        ? "rule"
        : keepHigh.source || prev.source;
    map.set(k, keepHigh);
  }
  return [...map.values()];
}
