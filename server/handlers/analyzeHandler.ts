// The entire analysis happens here?

import { Storage } from "./storage.js";
import { postprocessFindingsLLMOnly } from "../utils/postprocess.js";
import type { Finding } from "../models/findings.js";
import { ANALYZE_PROMPT } from "../utils/prompts.js";
import {
  geminiAnalyzeText,
  geminiVisionToText,
  geminiRepairJson,
} from "./gemini.js";
import { FindingsPayloadSchema } from "../models/schemas.js";
import { mergeFindings } from "../utils/merge.js";
import { parseWithRepair } from "../utils/llmJson.js";

export async function analyzeTask(id: string) {
  const task = Storage.get(id);
  if (!task) return { status: 404, error: "not found" } as const;

  try {
    // 1) Ensure text (OCR if image), and persist OCR so autofix can diff later
    let rawText = task.input.text;
    if (!rawText && task.input.imageBase64) {
      const ocr = await geminiVisionToText(
        "Extract the literal text content of this configuration file or terminal output.",
        task.input.imageBase64
      );
      rawText = ocr;
      task.input.text = ocr;
      Storage.update(task.id, { input: task.input });
    }
    if (!rawText) return { status: 400, error: "no input text" } as const;

    // 2) LLM audit (ONLY; rules removed)
    const prompt = ANALYZE_PROMPT(task.fileType, rawText);
    let llmRaw = await geminiAnalyzeText(prompt);

    // 3) Robust parse (extract or repair once)
    const parsed = await parseWithRepair(llmRaw, geminiRepairJson);
    if (!parsed) {
      return {
        status: 200,
        summary: "LLM returned no parseable findings.",
        findings: [] as Finding[],
      } as const;
    }

    const safe = FindingsPayloadSchema.safeParse(parsed);
    if (!safe.success) {
      return {
        status: 200,
        summary: "LLM output failed schema validation.",
        findings: [] as Finding[],
      } as const;
    }

    // 4) Tag as LLM and de-duplicate within LLM results
    const llmFindings: Finding[] = (safe.data.findings || []).map((x) => ({
      ...x,
      source: "llm" as const,
    }));

    // de-dupe within LLM first (your merge), then enrich, sort, cap
    const deduped = mergeFindings(llmFindings, []);
    const findings = postprocessFindingsLLMOnly({
      fileType: task.fileType,
      text: rawText,
      findings: deduped,
      // optional: override via env FINDINGS_LIMIT, default 8
    });

    const summary = safe.data.summary || "LLM-only findings.";
    Storage.update(task.id, { state: "PLANNED" as const });
    return { status: 200, summary, findings } as const;
  } catch (e: any) {
    return {
      status: 500,
      error: "analyze_failed",
      detail: e?.message,
    } as const;
  }
}
