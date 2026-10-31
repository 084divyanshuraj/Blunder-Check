import { z } from "zod";
import { LIMITS } from "./limits";

export const ImportanceSchema = z.enum(["high", "medium", "low"]);
export type Importance = z.infer<typeof ImportanceSchema>;

/** c1, c2, ... assigned by the checklist call; stable for the whole analysis. */
export const ChecklistIdSchema = z
  .string()
  .regex(/^c\d{1,2}$/, "checklist ids look like c1, c2, ...");

export const ChecklistItemSchema = z.object({
  id: ChecklistIdSchema,
  item: z.string().min(5).max(200),
  importance: ImportanceSchema,
});
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

/** Output of Gemini call 1. */
export const CoverageChecklistSchema = z
  .object({
    topicType: z.string().min(2).max(80),
    items: z.array(ChecklistItemSchema).min(5).max(12),
  })
  .refine((v) => new Set(v.items.map((i) => i.id)).size === v.items.length, {
    message: "checklist ids must be unique",
  });
export type CoverageChecklist = z.infer<typeof CoverageChecklistSchema>;

/** Body of POST /api/checklist. */
export const CoverageRequestSchema = z.object({
  question: z.string().trim().min(5).max(LIMITS.MAX_QUESTION_CHARS),
  goal: z.string().trim().min(5).max(LIMITS.MAX_QUESTION_CHARS),
});
export type CoverageRequest = z.infer<typeof CoverageRequestSchema>;
