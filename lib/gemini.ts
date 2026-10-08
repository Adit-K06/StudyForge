import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SubtaskSchema = z.object({
  title: z.string().min(1, "Subtask title is required"),
  notes: z.string().default(""),
  planned_minutes: z.number().int().positive().default(20),
});

export const MainTaskSchema = z.object({
  track: z.enum(["language", "dsa", "project"]),
  title: z.string().min(1, "Task title is required"),
  notes: z.string().default(""),
  planned_minutes: z.number().int().positive().default(45),
  subtasks: z.array(SubtaskSchema).default([]),
});

export const DayPlanSchema = z.object({
  day_number: z.number().int().positive(),
  summary: z.string(),
  tasks: z.array(MainTaskSchema).min(1, "At least one main task is required"),
});

export type Subtask = z.infer<typeof SubtaskSchema>;
export type MainTask = z.infer<typeof MainTaskSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;

export interface GeminiCallResult<T> {
  data: T;
  latencyMs: number;
  promptTokens?: number;
  responseTokens?: number;
  model: string;
}

/**
 * Executes a Gemini request with strict Zod validation, retry-with-backoff,
 * schema repair retry, and token/latency instrumentation.
 */
export async function generateStructuredWithGemini<T>(
  prompt: string,
  systemInstruction: string,
  schema: z.ZodType<T>,
  options: {
    model?: string;
    maxRetries?: number;
    timeoutMs?: number;
  } = {}
): Promise<GeminiCallResult<T>> {
  const modelName = options.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 45000;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables.");
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  let attempts = 0;
  let lastError: Error | null = null;
  let lastRawText = "";

  while (attempts <= maxRetries) {
    attempts++;
    const startTime = Date.now();

    try {
      // Setup timeout controller
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      // Generate content with timeout race
      const generatePromise = model.generateContent(
        attempts === 1
          ? prompt
          : `${prompt}\n\n[ATTENTION: Previous attempt produced invalid JSON or failed schema validation: ${lastError?.message}. Raw output was: ${lastRawText.slice(0, 500)}. Please output ONLY valid JSON adhering strictly to the requested schema.]`
      );

      const result = await Promise.race([generatePromise, timeoutPromise]);
      const latencyMs = Date.now() - startTime;

      const responseText = result.response.text();
      lastRawText = responseText;

      // Extract usage metadata if available
      const usageMetadata = result.response.usageMetadata;
      const promptTokens = usageMetadata?.promptTokenCount;
      const responseTokens = usageMetadata?.candidatesTokenCount;

      // Parse JSON safely
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (parseErr) {
        throw new Error(`Invalid JSON syntax returned by model: ${(parseErr as Error).message}`);
      }

      // Validate with Zod
      const validationResult = schema.safeParse(parsedJson);
      if (!validationResult.success) {
        throw new Error(
          `Zod validation error: ${validationResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ")}`
        );
      }

      console.log(`[Gemini Success] Model: ${modelName} | Latency: ${latencyMs}ms | Tokens: in=${promptTokens}, out=${responseTokens}`);

      return {
        data: validationResult.data,
        latencyMs,
        promptTokens,
        responseTokens,
        model: modelName,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Attempt ${attempts} Failed] ${err.message}`);

      // Check if rate limited (429 or RESOURCE_EXHAUSTED) or server error (503)
      const isRateLimit = err?.message?.includes("429") || err?.message?.includes("RESOURCE_EXHAUSTED");
      const isTransient = isRateLimit || err?.message?.includes("503") || err?.message?.includes("timed out");

      if (attempts <= maxRetries && isTransient) {
        const delay = Math.pow(2, attempts) * 1000 + Math.random() * 500;
        console.log(`[Gemini Backoff] Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise((res) => setTimeout(res, delay));
      } else if (attempts > maxRetries) {
        break;
      }
    }
  }

  throw new Error(`Gemini generation failed after ${attempts} attempts: ${lastError?.message || "Unknown error"}`);
}
