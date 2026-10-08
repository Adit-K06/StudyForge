import crypto from "crypto";

export interface DatabaseTask {
  id: string;
  user_id: string;
  day_id: string | null;
  parent_id: string | null;
  track: "language" | "dsa" | "project" | "internship";
  title: string;
  notes: string;
  planned_start: string | null;
  planned_minutes: number;
  done: boolean;
  done_at: string | null;
  user_edited: boolean;
  sort_order: number;
  source_hash: string;
}

export interface IncomingSubtask {
  title: string;
  notes?: string;
  planned_minutes?: number;
}

export interface IncomingMainTask {
  track: "language" | "dsa" | "project";
  title: string;
  notes?: string;
  planned_minutes?: number;
  subtasks?: IncomingSubtask[];
}

export interface MergePlanResult {
  tasksToInsert: Array<Omit<DatabaseTask, "id"> & { tempId: string; tempParentId?: string }>;
  tasksToUpdate: Array<Partial<DatabaseTask> & { id: string }>;
  tasksPreservedCount: number;
  conflicts: Array<{
    existingTask: DatabaseTask;
    incomingTitle: string;
    incomingNotes: string;
  }>;
}

/**
 * Calculates a content hash for a generated task based on track and title
 */
export function calculateTaskHash(task: { title: string; track?: string }): string {
  const content = `${task.track || ""}:${task.title.trim().toLowerCase()}`;
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 16);
}

/**
 * Safely merges newly generated tasks with existing tasks for a day.
 * CRITICAL RULE: Tasks with user_edited = true must NEVER be overwritten.
 */
export function mergeTasksSafely(
  existingTasks: DatabaseTask[],
  newPlanTasks: IncomingMainTask[],
  userId: string,
  dayId: string
): MergePlanResult {
  const tasksToInsert: MergePlanResult["tasksToInsert"] = [];
  const tasksToUpdate: MergePlanResult["tasksToUpdate"] = [];
  const conflicts: MergePlanResult["conflicts"] = [];
  let tasksPreservedCount = 0;

  // Build maps of existing parent tasks and subtasks
  const existingParents = existingTasks.filter((t) => !t.parent_id);
  const existingSubtasksByParent = new Map<string, DatabaseTask[]>();

  for (const t of existingTasks) {
    if (t.parent_id) {
      const list = existingSubtasksByParent.get(t.parent_id) || [];
      list.push(t);
      existingSubtasksByParent.set(t.parent_id, list);
    }
  }

  let sortOrder = 0;

  for (const mainTask of newPlanTasks) {
    const mainHash = calculateTaskHash(mainTask);
    const mainTitle = mainTask.title.trim();
    const mainNotes = mainTask.notes || "";
    const mainMinutes = mainTask.planned_minutes || 45;

    // Look for matching existing parent by source_hash or exact title
    const matchingParent = existingParents.find(
      (p) =>
        p.track === mainTask.track &&
        (p.source_hash === mainHash || p.title.trim().toLowerCase() === mainTitle.toLowerCase())
    );

    let activeParentId: string;
    let isParentTemp = false;

    if (matchingParent) {
      activeParentId = matchingParent.id;

      if (matchingParent.user_edited) {
        // PRESERVE user edited task!
        tasksPreservedCount++;
        if (matchingParent.title !== mainTitle || matchingParent.notes !== mainNotes) {
          conflicts.push({
            existingTask: matchingParent,
            incomingTitle: mainTitle,
            incomingNotes: mainNotes,
          });
        }
      } else {
        // Safe to update non-edited task
        tasksToUpdate.push({
          id: matchingParent.id,
          title: mainTitle,
          notes: mainNotes,
          planned_minutes: mainMinutes,
          source_hash: mainHash,
          sort_order: sortOrder++,
        });
      }
    } else {
      // New parent task to insert
      const tempParentId = `temp_parent_${sortOrder}`;
      isParentTemp = true;
      activeParentId = tempParentId;

      tasksToInsert.push({
        tempId: tempParentId,
        user_id: userId,
        day_id: dayId,
        parent_id: null,
        track: mainTask.track,
        title: mainTitle,
        notes: mainNotes,
        planned_start: null,
        planned_minutes: mainMinutes,
        done: false,
        done_at: null,
        user_edited: false,
        sort_order: sortOrder++,
        source_hash: mainHash,
      });
    }

    // Process subtasks
    let subOrder = 0;
    const existingChildren = isParentTemp ? [] : existingSubtasksByParent.get(activeParentId) || [];
    const subtasksList = mainTask.subtasks || [];

    for (const sub of subtasksList) {
      const subTitle = sub.title.trim();
      const subNotes = sub.notes || "";
      const subMinutes = sub.planned_minutes || 20;
      const subHash = calculateTaskHash({ title: subTitle, track: mainTask.track });

      const matchingChild = existingChildren.find(
        (c) => c.source_hash === subHash || c.title.trim().toLowerCase() === subTitle.toLowerCase()
      );

      if (matchingChild) {
        if (matchingChild.user_edited) {
          tasksPreservedCount++;
          if (matchingChild.title !== subTitle || matchingChild.notes !== subNotes) {
            conflicts.push({
              existingTask: matchingChild,
              incomingTitle: subTitle,
              incomingNotes: subNotes,
            });
          }
        } else {
          tasksToUpdate.push({
            id: matchingChild.id,
            title: subTitle,
            notes: subNotes,
            planned_minutes: subMinutes,
            source_hash: subHash,
            sort_order: subOrder++,
          });
        }
      } else {
        tasksToInsert.push({
          tempId: `temp_sub_${sortOrder}_${subOrder}`,
          tempParentId: isParentTemp ? activeParentId : undefined,
          user_id: userId,
          day_id: dayId,
          parent_id: isParentTemp ? null : activeParentId,
          track: mainTask.track,
          title: subTitle,
          notes: subNotes,
          planned_start: null,
          planned_minutes: subMinutes,
          done: false,
          done_at: null,
          user_edited: false,
          sort_order: subOrder++,
          source_hash: subHash,
        });
      }
    }
  }

  return {
    tasksToInsert,
    tasksToUpdate,
    tasksPreservedCount,
    conflicts,
  };
}
