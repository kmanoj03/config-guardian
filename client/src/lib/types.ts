import { z } from 'zod';

// Severity levels
export const SeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
export type Severity = z.infer<typeof SeveritySchema>;

// File types
export const FileTypeSchema = z.enum(['dockerfile', 'k8s', 'env', 'nginx', 'iam']);
export type FileType = z.infer<typeof FileTypeSchema>;

// Task states
export const TaskStateSchema = z.enum(['INGESTED', 'ANALYZED', 'PLANNED', 'PATCHED', 'VERIFIED', 'REPORTED', 'DONE']);
export type TaskState = z.infer<typeof TaskStateSchema>;

// Finding schema
export const FindingSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  evidence: z.string(),
  rationale: z.string(),
  recommendation: z.string(),
  lineRange: z.tuple([z.number(), z.number()]).optional(),
  source: z.enum(['rule', 'llm']),
});

export type Finding = z.infer<typeof FindingSchema>;

// Task schema
export const TaskSchema = z.object({
  id: z.string(),
  fileType: FileTypeSchema,
  state: TaskStateSchema,
  input: z.object({
    text: z.string().optional(),
    imageBase64: z.string().optional(),
  }),
  findings: z.array(FindingSchema).optional(),
  summary: z.string().optional(),
  patchDiff: z.string().optional(),
  patchedText: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

// API response schemas
export const CreateTaskResponseSchema = z.object({
  taskId: z.string(),
});

export const AnalyzeResponseSchema = z.object({
  findings: z.array(FindingSchema),
});

export const AutofixResponseSchema = z.object({
  diff: z.string(),
  patchedText: z.string(),
});

export const ReportResponseSchema = z.object({
  markdown: z.string(),
});

// UI state types
export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AppState {
  currentTask: Task | null;
  selectedFinding: Finding | null;
  toasts: Toast[];
  isLoading: boolean;
}

// Color mappings
export const severityColorMap: Record<Severity, string> = {
  LOW: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CRITICAL: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

export const fileTypeIconMap: Record<FileType, string> = {
  dockerfile: '🐳',
  k8s: '☸️',
  env: '⚙️',
  nginx: '🌐',
  iam: '🔐',
};
