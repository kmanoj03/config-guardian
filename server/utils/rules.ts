// This is just a base rule check which we do before gemini takes control.
// Helps us not make the UI look like it's loading forever?
// It's just like the basement to a tall building? Couldn't think of a better analogy lol

import yaml from "js-yaml";
import type { FileType } from "../models/types.js";
import { findLineRange } from "./lines.js";

export interface Finding {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lineRange?: [number, number];
  evidence: string;
  rationale: string;
  recommendation: string;
  autofixHint?: string;
  source?: "rule" | "llm";
}

let idSeq = 1;
const gid = (p: string) => `CG-${p}-${String(idSeq++).padStart(3, "0")}`;

export function applyRuleChecks(text: string, fileType: FileType): Finding[] {
  const f: Finding[] = [];

  if (fileType === "dockerfile") {
    const lrFrom = findLineRange(text, /FROM\s+\S+:latest/i);
    if (lrFrom)
      f.push({
        id: gid("DKR"),
        title: "Unpinned base image (latest)",
        severity: "MEDIUM",
        lineRange: lrFrom,
        evidence: "FROM ...:latest",
        rationale: "Non-deterministic base image increases supply-chain risk",
        recommendation: "Pin to a specific version (e.g., node:20-alpine)",
        autofixHint: "Replace :latest with a pinned tag",
        source: "rule",
      });

    const hasUser = /^\s*USER\s+/im.test(text);
    if (!hasUser) {
      f.push({
        id: gid("DKR"),
        title: "Container runs as root",
        severity: "HIGH",
        lineRange: findLineRange(text, /^\s*(CMD|ENTRYPOINT)\b/im),
        evidence: "No USER directive found",
        rationale:
          "Least privilege violated; root container expands impact of escape",
        recommendation: "Create non-root user and set USER",
        autofixHint:
          "Add RUN addgroup -S app && adduser -S app -G app && USER app",
        source: "rule",
      });
    }

    const lrExpose = findLineRange(text, /EXPOSE\s+(22|2375)/i);
    if (lrExpose) {
      const m = text.match(/EXPOSE\s+(22|2375)/i);
      f.push({
        id: gid("DKR"),
        title: "Sensitive port exposed",
        severity: "HIGH",
        lineRange: lrExpose,
        evidence: `EXPOSE ${m?.[1]}`,
        rationale: "Undue attack surface (SSH/docker API)",
        recommendation: "Remove EXPOSE or restrict with firewall",
        autofixHint: "Remove EXPOSE for these ports",
        source: "rule",
      });
    }
  }

  if (fileType === "k8s") {
    try {
      const doc: any = yaml.load(text);
      const pods = doc?.spec?.template?.spec;
      const containers = [
        ...(pods?.containers || []),
        ...(pods?.initContainers || []),
      ];

      for (const c of containers) {
        const name = c?.name || "container";
        const sc = c?.securityContext;

        if (!sc || sc.runAsNonRoot !== true) {
          f.push({
            id: gid("K8S"),
            title: `[${name}] Missing runAsNonRoot`,
            severity: "HIGH",
            lineRange: findLineRange(text, /runAsNonRoot/),
            evidence: "securityContext absent or runAsNonRoot != true",
            rationale: "Least privilege",
            recommendation: "Set runAsNonRoot: true",
            autofixHint: "securityContext: { runAsNonRoot: true }",
            source: "rule",
          });
        }

        if (sc?.allowPrivilegeEscalation === true) {
          f.push({
            id: gid("K8S"),
            title: `[${name}] Privilege escalation allowed`,
            severity: "HIGH",
            lineRange: findLineRange(text, /allowPrivilegeEscalation/),
            evidence: "allowPrivilegeEscalation: true",
            rationale: "Privilege boundaries",
            recommendation: "Set allowPrivilegeEscalation: false",
            autofixHint: "securityContext.allowPrivilegeEscalation: false",
            source: "rule",
          });
        }

        const res = c?.resources;
        if (!res?.limits) {
          f.push({
            id: gid("K8S"),
            title: `[${name}] Missing resource limits`,
            severity: "MEDIUM",
            lineRange: findLineRange(text, /resources:/),
            evidence: "resources.limits absent",
            rationale: "Resource abuse/noisy neighbor risk",
            recommendation: "Define CPU/memory limits",
            autofixHint: "Add resources.limits for cpu/memory",
            source: "rule",
          });
        }
      }
    } catch {
      /* ignore YAML errors for MVP */
    }
  }

  return f;
}
