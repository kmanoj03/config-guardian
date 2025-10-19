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
