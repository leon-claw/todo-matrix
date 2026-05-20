import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_TASK_COLOR } from '../constants/taskAppearance';
import { clearTasks, loadTasks, saveTasks } from '../lib/localDatabase';
import { clampMetric, sortTasks } from '../lib/taskUtils';
import type { MatrixTask, TaskFormValues, TaskMetrics } from '../types';

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

function normalizeColor(value: string | undefined) {
  return value?.trim() || DEFAULT_TASK_COLOR;
}

function normalizeTask(task: StoredTask): MatrixTask {
  const timestamp = new Date().toISOString();

  return {
    id: task.id,
    title: task.title,
    notes: task.notes ?? '',
    importance: clampMetric(task.importance, 50),
    urgency: clampMetric(task.urgency, 50),
    color: normalizeColor(task.color),
    progress: clampMetric(task.progress, 0),
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
        const initialTasks = normalizedTasks ?? [];
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
    (input: TaskFormValues) => {
      const timestamp = new Date().toISOString();
      const nextTask: MatrixTask = {
        id: createId(),
        title: input.title.trim(),
        notes: input.notes.trim(),
        importance: clampMetric(input.importance, 50),
        urgency: clampMetric(input.urgency, 50),
        color: normalizeColor(input.color),
        progress: clampMetric(input.progress, 0),
        showOnAxis: input.showOnAxis,
        completed: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      commit([nextTask, ...tasks]);
    },
    [commit, tasks],
  );

  const updateTask = useCallback(
    (taskId: string, input: TaskFormValues) => {
      const timestamp = new Date().toISOString();
      commit(
        tasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: input.title.trim(),
                notes: input.notes.trim(),
                importance: clampMetric(input.importance, task.importance),
                urgency: clampMetric(input.urgency, task.urgency),
                color: normalizeColor(input.color),
                progress: clampMetric(input.progress, task.progress),
                showOnAxis: input.showOnAxis,
                updatedAt: timestamp,
              }
            : task,
        ),
      );
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
                progress: clampMetric(metrics.progress, task.progress),
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

  const clearLocalTasks = useCallback(async () => {
    setTasks([]);
    try {
      await clearTasks();
    } catch {
      setStorageError('本地数据清理失败，请检查浏览器存储权限。');
    }
  }, []);

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
    updateTask,
    toggleTask,
    updateTaskMetrics,
    toggleAxisVisibility,
    deleteTask,
    clearLocalTasks,
  };
}
