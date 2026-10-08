import { describe, it, expect } from "vitest";
import { discoverDaysFromTree, RepoTreeItem } from "@/lib/github";

describe("GitHub Day Discovery Regex & Ingestion", () => {
  it("discovers days from directory structure like phase1/week1/day1/...", () => {
    const mockTree: RepoTreeItem[] = [
      { path: "phase1/week1/day1/1_master_guide.md", type: "blob", sha: "sha1" },
      { path: "phase1/week1/day1/2_dsa_solutions.cpp", type: "blob", sha: "sha2" },
      { path: "phase1/week1/day2/1_linked_lists.md", type: "blob", sha: "sha3" },
      { path: "README.md", type: "blob", sha: "sha4" },
    ];

    const days = discoverDaysFromTree(mockTree);
    expect(days).toHaveLength(2);
    expect(days[0].dayNumber).toBe(1);
    expect(days[0].files).toHaveLength(2);
    expect(days[1].dayNumber).toBe(2);
    expect(days[1].files).toHaveLength(1);
  });

  it("discovers days from flat file layouts like day3.md or day3_extra.cpp", () => {
    const mockTree: RepoTreeItem[] = [
      { path: "curriculum/day3.md", type: "blob", sha: "sha30" },
      { path: "curriculum/day3_extra.cpp", type: "blob", sha: "sha31" },
      { path: "notes/day4.md", type: "blob", sha: "sha40" },
    ];

    const days = discoverDaysFromTree(mockTree);
    expect(days).toHaveLength(2);
    expect(days[0].dayNumber).toBe(3);
    expect(days[0].files).toHaveLength(2);
    expect(days[1].dayNumber).toBe(4);
    expect(days[1].files).toHaveLength(1);
  });

  it("ignores files in archive and archived folders by default", () => {
    const mockTree: RepoTreeItem[] = [
      { path: "phase1/week1/day1/1_master_guide.md", type: "blob", sha: "sha1" },
      { path: "phase1/week1/day1/archived/01_d1.md", type: "blob", sha: "sha2" },
      { path: "phase1/week1/day1/archive/old.md", type: "blob", sha: "sha3" },
    ];

    const days = discoverDaysFromTree(mockTree);
    expect(days).toHaveLength(1);
    expect(days[0].dayNumber).toBe(1);
    // Should exclude the 2 archived files
    expect(days[0].files).toHaveLength(1);
    expect(days[0].files[0].path).toBe("phase1/week1/day1/1_master_guide.md");
  });

  it("filters correctly by custom rootPath", () => {
    const mockTree: RepoTreeItem[] = [
      { path: "phase0/day1/basics.md", type: "blob", sha: "sha0" },
      { path: "phase1/week1/day1/guide.md", type: "blob", sha: "sha1" },
    ];

    const days = discoverDaysFromTree(mockTree, { rootPath: "phase1" });
    expect(days).toHaveLength(1);
    expect(days[0].files[0].path).toBe("phase1/week1/day1/guide.md");
  });
});
