import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sessions, error } = await supabase
      .from("focus_sessions")
      .select("*, tasks(id, title, track)")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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
    const { task_id, started_at, ended_at, seconds } = body;

    if (!started_at || !ended_at || typeof seconds !== "number") {
      return NextResponse.json(
        { error: "Invalid session payload: started_at, ended_at, seconds required" },
        { status: 400 }
      );
    }

    const { data: session, error } = await supabase
      .from("focus_sessions")
      .insert({
        user_id: user.id,
        task_id: task_id || null,
        started_at,
        ended_at,
        seconds: Math.max(0, Math.round(seconds)),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
