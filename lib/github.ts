import crypto from "crypto";

export interface RepoTreeItem {
  path: string;
  mode?: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url?: string;
}

export interface DayDiscovery {
  dayNumber: number;
  repoPath: string; // Directory or main file path
  files: {
    path: string;
    sha: string;
    size?: number;
  }[];
  contentHash: string;
}

export interface IngestionOptions {
  rootPath?: string;
  ignoreFolders?: string[];
}

export const DEFAULT_IGNORE_FOLDERS = ["archive", "archived", ".git", ".github"];

/**
 * Extracts owner and repo from various formats (https://github.com/owner/repo or owner/repo)
 */
export function parseGitHubRepo(repoUrl: string): { owner: string; repo: string } {
  const cleaned = repoUrl.trim().replace(/\/+$/, "");
  const match = cleaned.match(/(?:github\.com\/)?([^/]+)\/([^/]+)$/i);
  if (!match) {
    throw new Error(`Invalid GitHub repository URL or slug: ${repoUrl}`);
  }
  return { owner: match[1], repo: match[2].replace(/\.git$/i, "") };
}

/**
 * Discovers days and their associated files from GitHub tree items.
 * Supports:
 * 1. Directory layouts: e.g. `phase1/week1/day1/file.md`
 * 2. Flat file layouts: e.g. `curriculum/day1.md`, `curriculum/day1_extra.cpp`
 * Honors rootPath and ignores any path containing segments in ignoreFolders.
 */
export function discoverDaysFromTree(
  tree: RepoTreeItem[],
  options: IngestionOptions = {}
): DayDiscovery[] {
  const rootPath = (options.rootPath || "").trim().replace(/^\/+|\/+$/g, "");
  const ignoreFolders = (options.ignoreFolders && options.ignoreFolders.length > 0
    ? options.ignoreFolders
    : DEFAULT_IGNORE_FOLDERS
  ).map((f) => f.toLowerCase().trim());

  // Only consider blob files (not tree directories themselves)
  const blobs = tree.filter((item) => item.type === "blob");

  const dayMap = new Map<number, { repoPath: string; files: { path: string; sha: string; size?: number }[] }>();

  // Regular expressions to detect day number
  // Pattern 1: Folder segment: /day(\d+)/ or starting with day(\d+)/
  const folderRegex = /(?:^|\/)day(\d+)(?:\/|$)/i;
  // Pattern 2: Flat file: day(\d+)(?:_.*)?\.[a-z0-9]+$
  const fileRegex = /(?:^|\/)day(\d+)(?:[._-][^/]*)*\.[a-z0-9]+$/i;

  for (const item of blobs) {
    let relPath = item.path;

    // Filter by rootPath if specified
    if (rootPath) {
      if (!relPath.startsWith(rootPath + "/") && relPath !== rootPath) {
        continue;
      }
    }

    // Split into segments to check ignore list
    const segments = relPath.split("/").map((s) => s.toLowerCase());
    const isIgnored = segments.some((segment) => ignoreFolders.includes(segment));
    if (isIgnored) {
      continue;
    }

    let dayNum: number | null = null;
    let baseRepoPath = "";

    // Check directory pattern first
    const folderMatch = relPath.match(folderRegex);
    if (folderMatch) {
      dayNum = parseInt(folderMatch[1], 10);
      // Determine the directory path representing this day
      const dayFolderIdx = relPath.toLowerCase().indexOf(`day${dayNum}`);
      if (dayFolderIdx !== -1) {
        baseRepoPath = relPath.substring(0, dayFolderIdx + `day${dayNum}`.length);
      } else {
        baseRepoPath = relPath;
      }
    } else {
      // Check flat file pattern
      const fileMatch = relPath.match(fileRegex);
      if (fileMatch) {
        dayNum = parseInt(fileMatch[1], 10);
        baseRepoPath = relPath;
      }
    }

    if (dayNum !== null && !isNaN(dayNum)) {
      if (!dayMap.has(dayNum)) {
        dayMap.set(dayNum, {
          repoPath: baseRepoPath,
          files: [],
        });
      }
      dayMap.get(dayNum)!.files.push({
        path: item.path,
        sha: item.sha,
        size: item.size,
      });
    }
  }

  // Calculate content hashes and sort
  const result: DayDiscovery[] = [];
  for (const [dayNumber, data] of dayMap.entries()) {
    // Sort files by path for deterministic hashing
    data.files.sort((a, b) => a.path.localeCompare(b.path));
    const combinedShas = data.files.map((f) => `${f.path}:${f.sha}`).join("|");
    const contentHash = crypto.createHash("sha256").update(combinedShas).digest("hex");

    result.push({
      dayNumber,
      repoPath: data.repoPath,
      files: data.files,
      contentHash,
    });
  }

  // Sort days in ascending order
  result.sort((a, b) => a.dayNumber - b.dayNumber);
  return result;
}

/**
 * Fetches the entire repository tree from GitHub REST API
 */
export async function fetchGitHubTree(
  repoUrl: string,
  branch = "main",
  token?: string
): Promise<RepoTreeItem[]> {
  const { owner, repo } = parseGitHubRepo(repoUrl);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "StudyForge-App",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const res = await fetch(url, { headers, next: { revalidate: 60 } });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`GitHub API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  if (!data.tree || !Array.isArray(data.tree)) {
    throw new Error("Invalid GitHub tree response: 'tree' array missing");
  }

  return data.tree as RepoTreeItem[];
}

/**
 * Fetches the raw content of a specific file/blob by sha or path
 */
export async function fetchGitHubBlobContent(
  repoUrl: string,
  sha: string,
  token?: string
): Promise<string> {
  const { owner, repo } = parseGitHubRepo(repoUrl);
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "StudyForge-App",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    throw new Error(`Failed to fetch blob ${sha} (${res.status})`);
  }

  const data = await res.json();
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }

  return data.content || "";
}

/**
 * Sanitizes untrusted repository markdown/code to protect against prompt injection.
 * Wraps content in strict boundary delimiters and strips dangerous evasion directives.
 */
export function formatUntrustedContent(path: string, content: string): string {
  const boundary = "====UNTRUSTED_ROADMAP_FILE====";
  return `
${boundary}
FILE_PATH: ${path}
--- CONTENT START ---
${content.replace(/====/g, "====")}
--- CONTENT END ---
${boundary}
`.trim();
}
