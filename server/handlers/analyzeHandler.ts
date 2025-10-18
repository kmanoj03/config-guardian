// The entire analysis happens here?

import { Storage } from "./storage.js";
import { applyRuleChecks, type Finding } from "../utils/rules.js";
import { ANALYZE_PROMPT } from "../utils/prompts.js";
import { geminiAnalyzeText, geminiVisionToText } from "./gemini.js";
import { FindingsPayloadSchema } from "../models/schemas.js";
import { mergeFindings } from "../utils/merge.js";

export async function analyzeTask(id: string) {
  const task = Storage.get(id);
  if (!task) return { status: 404, error: "not found" } as const;

  try {
    // 1) text or OCR (persist OCR for later diffs)
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

    // 2) rules (tag as rule)
    const ruleFindings: Finding[] = applyRuleChecks(rawText, task.fileType).map(
      (x) => ({ ...x, source: "rule" as const })
    );

    // 3) LLM audit (tag as llm)
    const prompt = ANALYZE_PROMPT(task.fileType, rawText);
    let llm = await geminiAnalyzeText(prompt);
    llm = llm.replace(/```json|```/g, "").trim();

    let llmFindings: Finding[] = [];
    let summary = ruleFindings.length
      ? "Deterministic rule findings."
      : "No deterministic findings.";

    const parsed = FindingsPayloadSchema.safeParse(JSON.parse(llm));
    if (parsed.success) {
      summary = parsed.data.summary || summary;
      llmFindings = parsed.data.findings.map((x) => ({
        ...x,
        source: "llm" as const,
      }));
    }

    // 4) merge (severity normalization + richer text)
    const findings = mergeFindings(ruleFindings, llmFindings);

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
