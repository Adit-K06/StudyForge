import { z } from "zod";
import { SubtaskSchema } from "./gemini";

export const InternshipTaskSchema = z.object({
  title: z.string().min(1),
  notes: z.string().default(""),
  planned_minutes: z.number().int().positive().default(45),
  subtasks: z.array(SubtaskSchema).default([]),
});

export const InternshipDaySchema = z.object({
  day_number: z.number().int().positive(),
  day_theme: z.string(),
  tasks: z.array(InternshipTaskSchema).min(1),
});

export const InternshipPlanSchema = z.object({
  project_title: z.string(),
  architecture_summary: z.string(),
  interview_topics: z.array(z.string()),
  days: z.array(InternshipDaySchema).min(1),
});

export type InternshipPlan = z.infer<typeof InternshipPlanSchema>;
