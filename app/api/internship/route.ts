import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStructuredWithGemini } from "@/lib/gemini";
import { InternshipPlanSchema, InternshipPlan } from "@/lib/internship";
import { calculateTaskHash } from "@/lib/tasks";

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
    const projectBrief = (body.projectBrief || "").trim();
    const numberOfDays = Math.min(30, Math.max(1, parseInt(body.numberOfDays, 10) || 4));

    if (!projectBrief) {
      return NextResponse.json({ error: "Project brief is required" }, { status: 400 });
    }

    const systemInstruction = `
You are a Principal Software Engineering Architect and Interview Coach.
Generate a rigorous, day-by-day practical internship learning plan for ${numberOfDays} days for this brief: "${projectBrief}".

CRITICAL REQUIREMENTS:
1. NO hard-coded syllabus: dynamically generate the architecture, interview topics, and build tasks specifically for this brief.
2. Structure the ${numberOfDays} days logically:
   - Day 1: Ideation, scope, architecture & system design (data modeling, schema).
   - Middle Days: Deep dive into the specific interview concepts an interviewer will probe for this system (e.g. networking, DB indexing/transactions, hashing/salting/encryption, sessions/JWT, OAuth, rate limiting, connection pooling, caching) + hands-on core build.
   - Final Day(s): Testing, deployment, CI/CD pipeline, Docker, and DevOps observability.
3. Every main task must include concise subtasks with concrete action items.
`.trim();

    const prompt = `
Create an internship learning and build plan for:
Project Brief: ${projectBrief}
Duration: ${numberOfDays} days
`.trim();

    const geminiResult = await generateStructuredWithGemini(
      prompt,
      systemInstruction,
      InternshipPlanSchema,
      { maxRetries: 2, timeoutMs: 50000 }
    );

    const plan = geminiResult.data;

    // Insert generated tasks into database with track = 'internship'
    let orderIndex = 0;
    const insertedTasks = [];

    for (const day of plan.days) {
      for (const mainTask of day.tasks) {
        const mainHash = calculateTaskHash({ title: mainTask.title, track: "internship" });

        const { data: parentTask } = await supabase
          .from("tasks")
          .insert({
            user_id: user.id,
            day_id: null, // General project task
            parent_id: null,
            track: "internship",
            title: `[Day ${day.day_number}: ${day.day_theme}] ${mainTask.title}`,
            notes: mainTask.notes,
            planned_minutes: mainTask.planned_minutes,
            done: false,
            user_edited: false,
            sort_order: orderIndex++,
            source_hash: mainHash,
          })
          .select()
          .single();

        if (parentTask) {
          insertedTasks.push(parentTask);

          for (const sub of mainTask.subtasks || []) {
            const subHash = calculateTaskHash({ title: sub.title, track: "internship" });
            const { data: childTask } = await supabase
              .from("tasks")
              .insert({
                user_id: user.id,
                day_id: null,
                parent_id: parentTask.id,
                track: "internship",
                title: sub.title,
                notes: sub.notes,
                planned_minutes: sub.planned_minutes,
                done: false,
                user_edited: false,
                sort_order: orderIndex++,
                source_hash: subHash,
              })
              .select()
              .single();

            if (childTask) insertedTasks.push(childTask);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      tasksCreatedCount: insertedTasks.length,
      latencyMs: geminiResult.latencyMs,
    });
  } catch (err: any) {
    console.error("Internship generator error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate plan" }, { status: 500 });
  }
}
