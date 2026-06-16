import type { SubTodo } from '../types';

export function createSubTodo(title = ''): SubTodo {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    completed: false,
    id,
    title,
  };
}

export function calculateSubtaskProgress(subtasks: SubTodo[]) {
  if (!subtasks.length) {
    return 0;
  }

  return Math.round((subtasks.filter((subtask) => subtask.completed).length / subtasks.length) * 100);
}

export function normalizeSubtasks(value: unknown): SubTodo[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const subtask = item as Partial<SubTodo>;
      const title = typeof subtask.title === 'string' ? subtask.title.trim() : '';
      if (!title) {
        return null;
      }

      return {
        completed: Boolean(subtask.completed),
        id: typeof subtask.id === 'string' && subtask.id ? subtask.id : createSubTodo().id,
        title,
      };
    })
    .filter((subtask): subtask is SubTodo => Boolean(subtask));
}
