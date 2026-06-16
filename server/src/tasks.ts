import type { Task } from '@prisma/client';
import type { TaskInput } from './schemas';

export function clampMetric(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeSubtasks(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const subtask = item as { completed?: unknown; id?: unknown; title?: unknown };
      const title = typeof subtask.title === 'string' ? subtask.title.trim() : '';
      const id = typeof subtask.id === 'string' ? subtask.id.trim() : '';
      if (!id || !title) {
        return null;
      }

      return {
        completed: Boolean(subtask.completed),
        id,
        title,
      };
    })
    .filter((subtask): subtask is { completed: boolean; id: string; title: string } => Boolean(subtask));
}

export function calculateSubtaskProgress(subtasks: ReturnType<typeof normalizeSubtasks>) {
  if (!subtasks.length) {
    return 0;
  }

  return clampMetric((subtasks.filter((subtask) => subtask.completed).length / subtasks.length) * 100);
}

export function toTaskResponse(task: Task) {
  const subtasks = normalizeSubtasks(task.subtasks);
  const autoProgress = task.autoProgress;

  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    subtasks,
    importance: task.importance,
    urgency: task.urgency,
    color: task.color,
    progress: autoProgress ? calculateSubtaskProgress(subtasks) : task.progress,
    autoProgress,
    showOnAxis: task.showOnAxis,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toTaskCreateInput(userId: string, input: TaskInput) {
  const subtasks = normalizeSubtasks(input.subtasks);
  const autoProgress = input.autoProgress;

  return {
    userId,
    title: input.title,
    notes: input.notes,
    subtasks,
    importance: clampMetric(input.importance),
    urgency: clampMetric(input.urgency),
    color: input.color,
    progress: autoProgress ? calculateSubtaskProgress(subtasks) : clampMetric(input.progress),
    autoProgress,
    showOnAxis: input.showOnAxis,
    completed: input.completed,
  };
}
