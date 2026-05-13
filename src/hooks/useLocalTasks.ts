import { useCallback, useEffect, useMemo, useState } from 'react';
import { sampleTasks } from '../data/sampleTasks';
import { loadTasks, saveTasks } from '../lib/localDatabase';
import type { MatrixTask, TaskMetrics } from '../types';

interface NewTaskInput extends TaskMetrics {
  title: string;
  notes: string;
  showOnAxis: boolean;
}

const TODO_SORT_WEIGHTS = {
  importance: 1,
  urgency: 1,
};

type StoredTask = Partial<MatrixTask> & {
  id: string;
  title: string;
  notes?: string;
};

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clampMetric(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeTask(task: StoredTask): MatrixTask {
  const timestamp = new Date().toISOString();

  return {
    id: task.id,
    title: task.title,
    notes: task.notes ?? '',
    importance: clampMetric(task.importance, 50),
    urgency: clampMetric(task.urgency, 50),
    showOnAxis: task.showOnAxis ?? true,
    completed: task.completed ?? false,
    createdAt: task.createdAt ?? timestamp,
    updatedAt: task.updatedAt ?? timestamp,
  };
}

function normalizeTasks(tasks: MatrixTask[] | null) {
  if (!tasks) {
    return null;
  }

  return tasks.map((task) => normalizeTask(task as StoredTask));
}

function getTaskScore(task: MatrixTask) {
  return (
    task.importance * TODO_SORT_WEIGHTS.importance +
    task.urgency * TODO_SORT_WEIGHTS.urgency
  );
}

function sortTasks(tasks: MatrixTask[]) {
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

export function useLocalTasks() {
  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadTasks()
      .then((storedTasks) => {
        if (!active) {
          return;
        }

        const normalizedTasks = normalizeTasks(storedTasks);
        const initialTasks = normalizedTasks ?? sampleTasks;
        const sortedTasks = sortTasks(initialTasks);
        setTasks(sortedTasks);

        if (!storedTasks || normalizedTasks !== storedTasks) {
          return saveTasks(sortedTasks);
        }

        return undefined;
      })
      .catch(() => {
        if (active) {
          setStorageError('本地数据读取失败，请检查浏览器存储权限。');
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((nextTasks: MatrixTask[]) => {
    const sortedTasks = sortTasks(nextTasks);
    setTasks(sortedTasks);
    saveTasks(sortedTasks).catch(() => {
      setStorageError('本地保存失败，请检查浏览器存储空间。');
    });
  }, []);

  const addTask = useCallback(
    (input: NewTaskInput) => {
      const timestamp = new Date().toISOString();
      const nextTask: MatrixTask = {
        id: createId(),
        title: input.title.trim(),
        notes: input.notes.trim(),
        importance: clampMetric(input.importance, 50),
        urgency: clampMetric(input.urgency, 50),
        showOnAxis: input.showOnAxis,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      commit([nextTask, ...tasks]);
    },
    [commit, tasks],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      const timestamp = new Date().toISOString();
      commit(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, completed: !task.completed, updatedAt: timestamp }
            : task,
        ),
      );
    },
    [commit, tasks],
  );

  const updateTaskMetrics = useCallback(
    (taskId: string, metrics: Partial<TaskMetrics>) => {
      const timestamp = new Date().toISOString();
      commit(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                importance: clampMetric(metrics.importance, task.importance),
                urgency: clampMetric(metrics.urgency, task.urgency),
                updatedAt: timestamp,
              }
            : task,
        ),
      );
    },
    [commit, tasks],
  );

  const toggleAxisVisibility = useCallback(
    (taskId: string) => {
      const timestamp = new Date().toISOString();
      commit(
        tasks.map((task) =>
          task.id === taskId
            ? { ...task, showOnAxis: !task.showOnAxis, updatedAt: timestamp }
            : task,
        ),
      );
    },
    [commit, tasks],
  );

  const deleteTask = useCallback(
    (taskId: string) => {
      commit(tasks.filter((task) => task.id !== taskId));
    },
    [commit, tasks],
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;
    const shownOnAxis = tasks.filter((task) => task.showOnAxis && !task.completed).length;

    return {
      total: tasks.length,
      active: tasks.length - completed,
      completed,
      shownOnAxis,
    };
  }, [tasks]);

  return {
    tasks,
    isLoading,
    storageError,
    stats,
    addTask,
    toggleTask,
    updateTaskMetrics,
    toggleAxisVisibility,
    deleteTask,
  };
}
