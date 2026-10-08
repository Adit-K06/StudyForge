import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_IGNORE_FOLDERS } from "@/lib/github";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      settings: settings || {
        repo_url: process.env.GITHUB_REPO_URL || "https://github.com/adi-training/swe-roadmap",
        repo_branch: process.env.GITHUB_REPO_BRANCH || "main",
        root_path: "",
        ignore_folders: DEFAULT_IGNORE_FOLDERS,
        last_synced_at: null,
      },
    });
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
    const { repo_url, repo_branch, root_path, ignore_folders } = body;

    const { data: updated, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: user.id,
        repo_url: repo_url?.trim() || "https://github.com/adi-training/swe-roadmap",
        repo_branch: repo_branch?.trim() || "main",
        root_path: root_path?.trim() || "",
        ignore_folders: Array.isArray(ignore_folders) ? ignore_folders : DEFAULT_IGNORE_FOLDERS,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
