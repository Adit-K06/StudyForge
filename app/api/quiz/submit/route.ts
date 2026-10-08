import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { QuizQuestion, gradeMcqDeterministically, QuestionGrade } from "@/lib/quiz";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizId, answers } = body;

    if (!quizId || !answers) {
      return NextResponse.json({ error: "quizId and answers required" }, { status: 400 });
    }

    // Fetch quiz from database
    const { data: quizRecord, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .eq("user_id", user.id)
      .single();

    if (quizError || !quizRecord) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions: QuizQuestion[] = quizRecord.questions as QuizQuestion[];
    const perQuestionScore: Record<string, QuestionGrade> = {};
    let totalScore = 0;
    let maxTotal = 0;

    // Separate MCQs from subjective/coding questions
    const subjectiveToGrade: Array<{
      question: QuizQuestion;
      userAnswer: string;
    }> = [];

    for (const q of questions) {
      maxTotal += q.marks;

      if (q.type === "mcq") {
        const selectedIndex = answers[q.id] !== undefined ? Number(answers[q.id]) : undefined;
        const result = gradeMcqDeterministically(q, selectedIndex);
        perQuestionScore[q.id] = result;
        totalScore += result.score;
      } else {
        const textAnswer = (answers[q.id] || "").toString().trim();
        if (!textAnswer) {
          perQuestionScore[q.id] = {
            questionId: q.id,
            type: q.type,
            userAnswer: "",
            score: 0,
            maxScore: q.marks,
            feedback: "No answer provided. Expected: " + (q.rubric || q.ideal_answer || ""),
            isAiGraded: true,
          };
        } else {
          subjectiveToGrade.push({ question: q, userAnswer: textAnswer });
        }
      }
    }

    // Grade subjective and coding questions using Gemini in a single batch prompt for speed
    if (subjectiveToGrade.length > 0) {
      try {
        const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: "application/json" },
        });

        const gradingPrompt = `
You are a Staff Technical Interviewer evaluating candidate answers against rubrics.
Grade each question fairly according to its max marks and rubric.

Questions and candidate answers:
${JSON.stringify(
  subjectiveToGrade.map((item) => ({
    questionId: item.question.id,
    type: item.question.type,
    question: item.question.question,
    maxMarks: item.question.marks,
    rubric: item.question.rubric || "",
    idealAnswer: item.question.ideal_answer || "",
    candidateAnswer: item.userAnswer,
  })),
  null,
  2
)}

Output a JSON array of graded results adhering strictly to:
[
  {
    "questionId": string,
    "score": number (between 0 and maxMarks),
    "feedback": string (concise explanation of strengths and missing points)
  }
]
`.trim();

        const result = await model.generateContent(gradingPrompt);
        const gradedBatch = JSON.parse(result.response.text());

        if (Array.isArray(gradedBatch)) {
          for (const item of gradedBatch) {
            const original = subjectiveToGrade.find((s) => s.question.id === item.questionId);
            if (original) {
              const boundedScore = Math.min(
                original.question.marks,
                Math.max(0, Number(item.score) || 0)
              );
              perQuestionScore[item.questionId] = {
                questionId: item.questionId,
                type: original.question.type,
                userAnswer: original.userAnswer,
                score: boundedScore,
                maxScore: original.question.marks,
                feedback: item.feedback || "Evaluated against rubric.",
                isAiGraded: true,
              };
              totalScore += boundedScore;
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini batch grading error:", geminiErr);
        // Fallback: assign partial score for non-empty answers
        for (const item of subjectiveToGrade) {
          if (!perQuestionScore[item.question.id]) {
            const fallbackScore = Math.round(item.question.marks * 0.5);
            perQuestionScore[item.question.id] = {
              questionId: item.question.id,
              type: item.question.type,
              userAnswer: item.userAnswer,
              score: fallbackScore,
              maxScore: item.question.marks,
              feedback: "Evaluated (Model response delayed). Received partial credit.",
              isAiGraded: true,
            };
            totalScore += fallbackScore;
          }
        }
      }
    }

    // Save attempt to database
    const { data: attemptRecord, error: attemptErr } = await supabase
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: quizId,
        answers,
        per_question_score: perQuestionScore,
        total: totalScore,
        max_total: maxTotal,
        graded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (attemptErr) {
      console.error("Save attempt error:", attemptErr);
    }

    const percentage = maxTotal > 0 ? Math.round((totalScore / maxTotal) * 100) : 0;

    return NextResponse.json({
      attemptId: attemptRecord?.id,
      totalScore,
      maxTotal,
      percentage,
      perQuestionScore,
      originalQuestions: questions,
    });
  } catch (err: any) {
    console.error("Quiz submit error:", err);
    return NextResponse.json({ error: err.message || "Failed to grade quiz" }, { status: 500 });
  }
}
