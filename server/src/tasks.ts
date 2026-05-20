import type { Task } from '@prisma/client';
import type { TaskInput } from './schemas';

export function clampMetric(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function toTaskResponse(task: Task) {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    importance: task.importance,
    urgency: task.urgency,
    color: task.color,
    progress: task.progress,
    showOnAxis: task.showOnAxis,
    completed: task.completed,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export function toTaskCreateInput(userId: string, input: TaskInput) {
  return {
    userId,
    title: input.title,
    notes: input.notes,
    importance: clampMetric(input.importance),
    urgency: clampMetric(input.urgency),
    color: input.color,
    progress: clampMetric(input.progress),
    showOnAxis: input.showOnAxis,
    completed: input.completed,
  };
}
