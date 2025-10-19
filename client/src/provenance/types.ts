export type Finding = {
  id: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  lineRange?: [number, number];
  evidence?: string;
  rationale?: string;
  recommendation?: string;
  source?: "llm" | "rule";
};

export type EnvelopePayload = {
  taskId: string;
  fileType: string;
  summary: string;
  findings: Finding[];
  patchedText?: string;
  patchDiff?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
};

export type Envelope = {
  algo: "sha256";
  hash: string;
  createdAt: string;
  payload: EnvelopePayload;
  publishHint: string; // agent1... or URL
};

export type VerifyResp = {
  ok: boolean;
  recomputed: string;
  provided: string;
};
