import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/apiClient';
import { sortTasks } from '../lib/taskUtils';
import type { MatrixTask, TaskFormValues, TaskMetrics } from '../types';

function toTaskPayload(input: TaskFormValues) {
  return {
    title: input.title.trim(),
    notes: input.notes.trim(),
    importance: input.importance,
    urgency: input.urgency,
    color: input.color,
    progress: input.progress,
    showOnAxis: input.showOnAxis,
  };
}

export function useCloudTasks(enabled: boolean) {
  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [storageError, setStorageError] = useState<string | null>(null);

  const runSync = useCallback(async <T,>(operation: () => Promise<T>) => {
    setPendingSyncCount((current) => current + 1);
    try {
      return await operation();
    } finally {
      setPendingSyncCount((current) => Math.max(0, current - 1));
    }
  }, []);

  const reloadTasks = useCallback(async () => {
    if (!enabled) {
      setTasks([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest<{ tasks: MatrixTask[] }>('/api/tasks');
      setTasks(sortTasks(response.tasks));
      setStorageError(null);
    } catch {
      setStorageError('云端数据读取失败，请检查后端服务和网络。');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void reloadTasks();
  }, [reloadTasks]);

  const addTask = useCallback(async (input: TaskFormValues) => {
    const response = await runSync(() =>
      apiRequest<{ task: MatrixTask }>('/api/tasks', {
        method: 'POST',
        body: toTaskPayload(input),
      }),
    );
    setTasks((current) => sortTasks([response.task, ...current]));
  }, [runSync]);

  const updateTask = useCallback(async (taskId: string, input: TaskFormValues) => {
    const response = await runSync(() =>
      apiRequest<{ task: MatrixTask }>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: toTaskPayload(input),
      }),
    );
    setTasks((current) => sortTasks(current.map((task) => (task.id === taskId ? response.task : task))));
  }, [runSync]);

  const updateTaskMetrics = useCallback(async (taskId: string, metrics: Partial<TaskMetrics>) => {
    const response = await runSync(() =>
      apiRequest<{ task: MatrixTask }>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: metrics,
      }),
    );
    setTasks((current) => sortTasks(current.map((task) => (task.id === taskId ? response.task : task))));
  }, [runSync]);

  const toggleTask = useCallback(async (taskId: string) => {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) {
      return;
    }

    const response = await runSync(() =>
      apiRequest<{ task: MatrixTask }>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: { completed: !task.completed },
      }),
    );
    setTasks((current) => sortTasks(current.map((currentTask) => (currentTask.id === taskId ? response.task : currentTask))));
  }, [runSync, tasks]);

  const toggleAxisVisibility = useCallback(async (taskId: string) => {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) {
      return;
    }

    const response = await runSync(() =>
      apiRequest<{ task: MatrixTask }>(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: { showOnAxis: !task.showOnAxis },
      }),
    );
    setTasks((current) => sortTasks(current.map((currentTask) => (currentTask.id === taskId ? response.task : currentTask))));
  }, [runSync, tasks]);

  const deleteTask = useCallback(async (taskId: string) => {
    await runSync(() => apiRequest<void>(`/api/tasks/${taskId}`, { method: 'DELETE' }));
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }, [runSync]);

  const replaceCloudTasks = useCallback(async (nextTasks: MatrixTask[]) => {
    const response = await runSync(() =>
      apiRequest<{ tasks: MatrixTask[] }>('/api/migration/replace-tasks', {
        method: 'POST',
        body: { tasks: nextTasks },
      }),
    );
    setTasks(sortTasks(response.tasks));
  }, [runSync]);

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
    addTask,
    deleteTask,
    isLoading,
    isSyncing: isLoading || pendingSyncCount > 0,
    reloadTasks,
    replaceCloudTasks,
    stats,
    storageError,
    tasks,
    toggleAxisVisibility,
    toggleTask,
    updateTask,
    updateTaskMetrics,
  };
}
