import { describe, it, expect } from "vitest";
import { gradeMcqDeterministically, QuizQuestion } from "@/lib/quiz";

describe("Quiz Deterministic MCQ Scoring", () => {
  const sampleMcq: QuizQuestion = {
    id: "q1",
    type: "mcq",
    question: "What is the amortized time complexity of std::vector::push_back?",
    marks: 1,
    options: ["O(N)", "O(1)", "O(log N)", "O(N^2)"],
    correct_index: 1,
    explanation: "Doubling capacity when full gives O(1) amortized cost.",
  };

  it("awards full marks when student selects the exact correct option", () => {
    const result = gradeMcqDeterministically(sampleMcq, 1);
    expect(result.score).toBe(1);
    expect(result.isAiGraded).toBe(false);
    expect(result.feedback).toContain("Correct!");
  });

  it("awards 0 marks when student selects an incorrect option", () => {
    const result = gradeMcqDeterministically(sampleMcq, 0);
    expect(result.score).toBe(0);
    expect(result.isAiGraded).toBe(false);
    expect(result.feedback).toContain("Incorrect");
  });

  it("handles unanswered question gracefully", () => {
    const result = gradeMcqDeterministically(sampleMcq, undefined);
    expect(result.score).toBe(0);
    expect(result.userAnswer).toBe(-1);
  });
});
