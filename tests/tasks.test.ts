import { describe, it, expect } from "vitest";
import { mergeTasksSafely, DatabaseTask, calculateTaskHash } from "@/lib/tasks";
import { MainTask } from "@/lib/gemini";

describe("Task Safe Merge Logic", () => {
  const userId = "user-123";
  const dayId = "day-456";

  it("NEVER overwrites a task where user_edited is true", () => {
    const userEditedTask: DatabaseTask = {
      id: "task-1",
      user_id: userId,
      day_id: dayId,
      parent_id: null,
      track: "dsa",
      title: "My Custom DSA Notes & Practice",
      notes: "Custom notes added by student",
      planned_start: null,
      planned_minutes: 60,
      done: true,
      done_at: "2026-10-09T00:00:00Z",
      user_edited: true,
      sort_order: 0,
      source_hash: calculateTaskHash({ track: "dsa", title: "Original DSA Title" }),
    };

    const newPlan: MainTask[] = [
      {
        track: "dsa",
        title: "Original DSA Title",
        notes: "Overwritten by AI generator",
        planned_minutes: 30,
        subtasks: [],
      },
    ];

    const result = mergeTasksSafely([userEditedTask], newPlan, userId, dayId);

    // Verify user task was preserved
    expect(result.tasksPreservedCount).toBe(1);
    expect(result.tasksToUpdate).toHaveLength(0);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].existingTask.title).toBe("My Custom DSA Notes & Practice");
    expect(result.conflicts[0].incomingTitle).toBe("Original DSA Title");
  });

  it("safely updates tasks when user_edited is false", () => {
    const uneditedTask: DatabaseTask = {
      id: "task-2",
      user_id: userId,
      day_id: dayId,
      parent_id: null,
      track: "language",
      title: "C++ Vectors",
      notes: "Old description",
      planned_start: null,
      planned_minutes: 30,
      done: false,
      done_at: null,
      user_edited: false,
      sort_order: 0,
      source_hash: calculateTaskHash({ track: "language", title: "C++ Vectors" }),
    };

    const newPlan: MainTask[] = [
      {
        track: "language",
        title: "C++ Vectors",
        notes: "Updated refreshed description from new markdown",
        planned_minutes: 40,
        subtasks: [],
      },
    ];

    const result = mergeTasksSafely([uneditedTask], newPlan, userId, dayId);

    expect(result.tasksPreservedCount).toBe(0);
    expect(result.tasksToUpdate).toHaveLength(1);
    expect(result.tasksToUpdate[0].id).toBe("task-2");
    expect(result.tasksToUpdate[0].notes).toBe("Updated refreshed description from new markdown");
    expect(result.tasksToUpdate[0].planned_minutes).toBe(40);
  });

  it("inserts new tasks when they do not exist yet", () => {
    const newPlan: MainTask[] = [
      {
        track: "project",
        title: "Build Custom Vector Class",
        notes: "Implement dynamic array with capacity doubling",
        planned_minutes: 90,
        subtasks: [
          {
            title: "Implement push_back and pop_back",
            notes: "Manage memory reallocation",
            planned_minutes: 45,
          },
        ],
      },
    ];

    const result = mergeTasksSafely([], newPlan, userId, dayId);

    expect(result.tasksToInsert).toHaveLength(2); // 1 parent + 1 subtask
    expect(result.tasksToInsert[0].title).toBe("Build Custom Vector Class");
    expect(result.tasksToInsert[1].title).toBe("Implement push_back and pop_back");
  });
});
