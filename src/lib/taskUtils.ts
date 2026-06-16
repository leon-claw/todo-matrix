import type { MatrixTask } from '../types';

export const TODO_SORT_WEIGHTS = {
  importance: 1,
  urgency: 1,
};

export function clampMetric(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getTaskScore(task: MatrixTask) {
  return (
    task.importance * TODO_SORT_WEIGHTS.importance +
    task.urgency * TODO_SORT_WEIGHTS.urgency
  );
}

export function sortTasks(tasks: MatrixTask[]) {
  return [...tasks].sort((first, second) => {
    if (first.completed !== second.completed) {
      return Number(first.completed) - Number(second.completed);
    }

    const scoreDelta = getTaskScore(second) - getTaskScore(first);
    if (scoreDelta !== 0) {
      return scoreDelta;
    }

    return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
  });
}
