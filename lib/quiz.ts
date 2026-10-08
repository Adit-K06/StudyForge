import { z } from "zod";

export const QuizQuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["mcq", "coding", "subjective"]),
  question: z.string().min(5),
  marks: z.number().int().positive().default(1),
  // MCQ fields
  options: z.array(z.string()).optional(),
  correct_index: z.number().int().min(0).max(4).optional(),
  explanation: z.string().optional(),
  // Coding / Subjective fields
  rubric: z.string().optional(),
  ideal_answer: z.string().optional(),
});

export const QuizPayloadSchema = z.object({
  day_number: z.number(),
  title: z.string(),
  total_marks: z.number().int().positive(),
  questions: z.array(QuizQuestionSchema).min(10), // Ensures thorough questions
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type QuizPayload = z.infer<typeof QuizPayloadSchema>;

export interface QuestionGrade {
  questionId: string;
  type: "mcq" | "coding" | "subjective";
  userAnswer: string | number;
  score: number;
  maxScore: number;
  feedback: string;
  isAiGraded: boolean;
}

export interface QuizEvaluationResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  perQuestionScore: Record<string, QuestionGrade>;
}

/**
 * Deterministically grades MCQ questions without calling an LLM.
 */
export function gradeMcqDeterministically(
  question: QuizQuestion,
  userSelectedOptionIndex: number | undefined
): QuestionGrade {
  const isCorrect = userSelectedOptionIndex === question.correct_index;
  const score = isCorrect ? question.marks : 0;

  return {
    questionId: question.id,
    type: "mcq",
    userAnswer: userSelectedOptionIndex ?? -1,
    score,
    maxScore: question.marks,
    feedback: isCorrect
      ? "Correct! " + (question.explanation || "")
      : `Incorrect. Correct answer was option ${(question.correct_index ?? 0) + 1}. ` +
        (question.explanation || ""),
    isAiGraded: false,
  };
}
