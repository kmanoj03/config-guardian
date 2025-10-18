// Basically this strengths the server ; this acts as the base language
// which the agent would speak consistently acorss the pipeline.
// If not for this ; one malformed res from gemini would make the UI go crazy with broken fields.

import { z } from "zod";

export const FindingSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    lineRange: z.tuple([z.number(), z.number()]).optional(),
    evidence: z.string(),
    rationale: z.string(),
    recommendation: z.string(),
    autofixHint: z.string().optional(),
    source: z.enum(["rule", "llm"]).optional(),
  })
  .passthrough();

export const FindingsPayloadSchema = z.object({
  fileType: z.enum(["dockerfile", "k8s", "env", "nginx", "iam"]),
  summary: z.string(),
  findings: z.array(FindingSchema),
});
export type FindingsPayload = z.infer<typeof FindingsPayloadSchema>;
