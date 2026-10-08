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

    const { searchParams } = new URL(request.url);
    const dayId = searchParams.get("dayId");
    const dayNumber = searchParams.get("dayNumber");

    let query = supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    if (dayId) {
      query = query.eq("day_id", dayId);
    } else if (dayNumber) {
      // Find day_id from day_number
      const { data: dayRecord } = await supabase
        .from("days")
        .select("id")
        .eq("user_id", user.id)
        .eq("day_number", parseInt(dayNumber, 10))
        .single();

      if (dayRecord) {
        query = query.eq("day_id", dayRecord.id);
      } else {
        return NextResponse.json({ tasks: [] });
      }
    }

    const { data: tasks, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks: tasks || [] });
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
    const { day_id, parent_id, track, title, notes, planned_minutes, planned_start } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task title is required" }, { status: 400 });
    }

    const { data: newTask, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        day_id: day_id || null,
        parent_id: parent_id || null,
        track: track || "dsa",
        title: title.trim(),
        notes: notes || "",
        planned_minutes: planned_minutes ? parseInt(planned_minutes, 10) : 30,
        planned_start: planned_start || null,
        done: false,
        done_at: null,
        user_edited: true,
        sort_order: 999,
        source_hash: "custom_user_task",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: newTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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
    const { id, done, title, notes, planned_minutes, planned_start, sort_order, user_edited } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (done !== undefined) {
      updatePayload.done = Boolean(done);
      updatePayload.done_at = done ? new Date().toISOString() : null;
    }

    if (title !== undefined) updatePayload.title = title;
    if (notes !== undefined) updatePayload.notes = notes;
    if (planned_minutes !== undefined) updatePayload.planned_minutes = parseInt(planned_minutes, 10);
    if (planned_start !== undefined) updatePayload.planned_start = planned_start;
    if (sort_order !== undefined) updatePayload.sort_order = parseInt(sort_order, 10);

    // If user edited content directly, mark user_edited: true
    if (user_edited !== undefined) {
      updatePayload.user_edited = Boolean(user_edited);
    } else if (title !== undefined || notes !== undefined || planned_minutes !== undefined) {
      updatePayload.user_edited = true;
    }

    const { data: updatedTask, error } = await supabase
      .from("tasks")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Delete task (foreign key CASCADE in Postgres will delete child subtasks if any)
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
