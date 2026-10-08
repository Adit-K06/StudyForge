import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  fetchGitHubTree,
  discoverDaysFromTree,
  fetchGitHubBlobContent,
  DEFAULT_IGNORE_FOLDERS,
} from "@/lib/github";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    // Load user settings if any, otherwise use default
    const { data: settings } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const repoUrl = settings?.repo_url || process.env.GITHUB_REPO_URL || "https://github.com/adi-training/swe-roadmap";
    const branch = settings?.repo_branch || process.env.GITHUB_REPO_BRANCH || "main";
    const rootPath = settings?.root_path || "";
    const ignoreFolders = settings?.ignore_folders || DEFAULT_IGNORE_FOLDERS;
    const token = process.env.GITHUB_TOKEN || undefined;

    // Fetch GitHub tree
    const tree = await fetchGitHubTree(repoUrl, branch, token);
    const discoveredDays = discoverDaysFromTree(tree, { rootPath, ignoreFolders });

    if (discoveredDays.length === 0) {
      return NextResponse.json({
        message: "No days discovered in the repository with the specified filters.",
        daysCount: 0,
      });
    }

    let insertedDaysCount = 0;
    let fetchedFilesCount = 0;
    let cachedFilesCount = 0;

    for (const d of discoveredDays) {
      // Upsert day record
      const { data: dayRecord, error: dayError } = await supabase
        .from("days")
        .upsert(
          {
            user_id: user.id,
            day_number: d.dayNumber,
            repo_path: d.repoPath,
            content_hash: d.contentHash,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "user_id,day_number" }
        )
        .select("id, content_hash")
        .single();

      if (dayError || !dayRecord) {
        console.error("Failed to upsert day:", dayError);
        continue;
      }
      insertedDaysCount++;

      // Check existing source files for this day
      const { data: existingSourceFiles } = await supabase
        .from("source_files")
        .select("path, git_sha")
        .eq("day_id", dayRecord.id);

      const existingShaMap = new Map<string, string>();
      if (existingSourceFiles) {
        for (const ef of existingSourceFiles) {
          existingShaMap.set(ef.path, ef.git_sha);
        }
      }

      // Fetch any files whose sha changed or doesn't exist
      for (const file of d.files) {
        if (existingShaMap.get(file.path) === file.sha) {
          cachedFilesCount++;
          continue;
        }

        try {
          const content = await fetchGitHubBlobContent(repoUrl, file.sha, token);
          fetchedFilesCount++;

          await supabase.from("source_files").upsert(
            {
              day_id: dayRecord.id,
              user_id: user.id,
              path: file.path,
              git_sha: file.sha,
              content,
            },
            { onConflict: "day_id,path" }
          );
        } catch (fileErr) {
          console.warn(`Failed to fetch file content for ${file.path}:`, fileErr);
        }
      }
    }

    // Update settings last_synced_at
    await supabase.from("user_settings").upsert({
      user_id: user.id,
      repo_url: repoUrl,
      repo_branch: branch,
      root_path: rootPath,
      ignore_folders: ignoreFolders,
      last_synced_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      daysDiscovered: discoveredDays.length,
      daysUpdated: insertedDaysCount,
      filesFetched: fetchedFilesCount,
      filesCached: cachedFilesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Sync API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync repository" },
      { status: 500 }
    );
  }
}
