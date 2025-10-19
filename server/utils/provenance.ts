import { createHash } from "crypto";
import type { AgentTask } from "../models/types.js";
import type { Finding } from "../models/findings.js";

/** Deterministic stringify: sorts keys deeply so hash is stable */
export function canonicalStringify(obj: any): string {
  return JSON.stringify(sortKeysDeep(obj));
}
function sortKeysDeep(v: any): any {
  if (Array.isArray(v)) return v.map(sortKeysDeep);
  if (v && typeof v === "object") {
    return Object.keys(v)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = sortKeysDeep(v[k]);
        return acc;
      }, {});
  }
  return v;
}

/** Normalize findings for stability: sort by severity desc then title */
export function normalizeFindings(fs: Finding[] = []): Finding[] {
  const order: Record<Finding["severity"], number> = {
    LOW: 0,
    MEDIUM: 1,
    HIGH: 2,
    CRITICAL: 3,
  };
  return [...fs].sort((a, b) => {
    const sev = order[b.severity] - order[a.severity];
    if (sev) return sev;
    return (a.title || "").localeCompare(b.title || "");
  });
}

export function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

/** Build the stable envelope object we’ll hash & return */
export function buildEnvelope(task: AgentTask) {
  const payload = {
    taskId: task.id,
    fileType: task.fileType,
    summary: (task as any).summary || "",
    findings: normalizeFindings((task as any).findings || []),
    patchedText: (task as any).patchedText || "",
    patchDiff: (task as any).patchDiff || "",
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    version: "cg-prov-1", // future proofing
  };
  const canonical = canonicalStringify(payload);
  const hash = sha256Hex(canonical);
  const envelope = {
    algo: "sha256",
    hash,
    createdAt: new Date().toISOString(),
    payload, // include normalized payload for verification
    publishHint:
      "agent1qg0342avl4g6g8mp779g2tmqhfdzntjy9amgv4lyv590uq0d6ucs573l3hh", // placeholder URI
  };
  return { envelope, canonical };
}
