import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, apiRequest } from '../lib/apiClient';
import { calculateSubtaskProgress, normalizeSubtasks } from '../lib/subtasks';
import { clampMetric, sortTasks } from '../lib/taskUtils';
import type { MatrixTask, TaskFormValues, TaskMetrics } from '../types';

const CLOUD_SYNC_DEBOUNCE_MS = 3000;
const CLOUD_PULL_INTERVAL_MS = 10 * 60 * 1000;
const CLOUD_PULL_DEBOUNCE_MS = 10000;

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCloudTask(task: MatrixTask): MatrixTask {
  const subtasks = normalizeSubtasks(task.subtasks);
  const autoProgress = task.autoProgress ?? false;

  return {
    ...task,
    notes: task.notes ?? '',
    subtasks,
    importance: clampMetric(task.importance, 50),
    urgency: clampMetric(task.urgency, 50),
    progress: autoProgress ? calculateSubtaskProgress(subtasks) : clampMetric(task.progress, 0),
    autoProgress,
    showOnAxis: task.showOnAxis ?? true,
    completed: task.completed ?? false,
  };
}

function toTaskFromInput(input: TaskFormValues, existingTask?: MatrixTask): MatrixTask {
  const timestamp = new Date().toISOString();
  const subtasks = normalizeSubtasks(input.subtasks);
  const autoProgress = input.autoProgress;

  return {
    id: existingTask?.id ?? createId(),
    title: input.title.trim(),
    notes: input.notes.trim(),
    subtasks,
    importance: clampMetric(input.importance, existingTask?.importance ?? 50),
    urgency: clampMetric(input.urgency, existingTask?.urgency ?? 50),
    color: input.color,
    progress: autoProgress ? calculateSubtaskProgress(subtasks) : clampMetric(input.progress, existingTask?.progress ?? 0),
    autoProgress,
    showOnAxis: input.showOnAxis,
    completed: existingTask?.completed ?? false,
    createdAt: existingTask?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function toSyncPayload(tasks: MatrixTask[]) {
  return {
    tasks: tasks.map((task) => {
      const normalizedTask = normalizeCloudTask(task);

      return {
        id: normalizedTask.id,
        title: normalizedTask.title,
        notes: normalizedTask.notes,
        subtasks: normalizedTask.subtasks,
        importance: normalizedTask.importance,
        urgency: normalizedTask.urgency,
        color: normalizedTask.color,
        progress: normalizedTask.progress,
        autoProgress: normalizedTask.autoProgress,
        showOnAxis: normalizedTask.showOnAxis,
        completed: normalizedTask.completed,
        createdAt: normalizedTask.createdAt,
      };
    }),
  };
}

async function submitTaskSnapshot(snapshot: MatrixTask[]) {
  return apiRequest<{ tasks: MatrixTask[] }>('/api/tasks/sync', {
    method: 'PUT',
    body: toSyncPayload(snapshot),
  });
}

function readRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.message) {
    if (error.status === 404) {
      return '404 Not Found，当前后端没有找到同步接口，请部署新版后端或检查桌面端 API 地址';
    }

    return error.status === 0 ? `网络请求失败：${error.message}` : `${error.status} ${error.message}`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
}

export function useCloudTasks(enabled: boolean) {
  const [tasks, setTasks] = useState<MatrixTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlushPending, setIsFlushPending] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const tasksRef = useRef<MatrixTask[]>([]);
  const pendingSnapshotRef = useRef<MatrixTask[] | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const pullTimerRef = useRef<number | null>(null);
  const flushPendingSyncRef = useRef<() => Promise<void>>(async () => undefined);
  const isFlushingRef = useRef(false);
  const isPullingRef = useRef(false);
  const lastPullAtRef = useRef(0);
  const syncPauseDepthRef = useRef(0);
  const isSyncPausedRef = useRef(false);
  const syncPauseVersionRef = useRef(0);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    isFlushingRef.current = isFlushing;
  }, [isFlushing]);

  useEffect(() => {
    if (!enabled) {
      syncPauseDepthRef.current = 0;
      isSyncPausedRef.current = false;
      syncPauseVersionRef.current += 1;
    }
  }, [enabled]);

  const clearSyncTimer = useCallback(() => {
    if (syncTimerRef.current) {
      window.clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }
  }, []);

  const clearPullTimer = useCallback(() => {
    if (pullTimerRef.current) {
      window.clearTimeout(pullTimerRef.current);
      pullTimerRef.current = null;
    }
  }, []);

  const scheduleFlush = useCallback(
    (delay = CLOUD_SYNC_DEBOUNCE_MS) => {
      clearSyncTimer();
      if (isSyncPausedRef.current) {
        return;
      }

      syncTimerRef.current = window.setTimeout(() => {
        syncTimerRef.current = null;
        void flushPendingSyncRef.current();
      }, delay);
    },
    [clearSyncTimer],
  );

  const flushPendingSync = useCallback(async () => {
    if (!enabled) {
      pendingSnapshotRef.current = null;
      setIsFlushPending(false);
      return;
    }

    if (isSyncPausedRef.current) {
      setIsFlushPending(Boolean(pendingSnapshotRef.current));
      return;
    }

    const snapshot = pendingSnapshotRef.current;
    if (!snapshot) {
      setIsFlushPending(false);
      return;
    }

    const requestPauseVersion = syncPauseVersionRef.current;
    pendingSnapshotRef.current = null;
    setIsFlushPending(false);
    isFlushingRef.current = true;
    setIsFlushing(true);
    try {
      const response = await submitTaskSnapshot(snapshot);
      lastPullAtRef.current = Date.now();
      if (!isSyncPausedRef.current && requestPauseVersion === syncPauseVersionRef.current) {
        setStorageError(null);
      }
      if (!pendingSnapshotRef.current && !isSyncPausedRef.current && requestPauseVersion === syncPauseVersionRef.current) {
        const nextTasks = sortTasks(response.tasks.map(normalizeCloudTask));
        tasksRef.current = nextTasks;
        setTasks(nextTasks);
      }
    } catch (error) {
      const errorMessage = readRequestErrorMessage(error);
      setStorageError(
        errorMessage ? `云端数据同步失败：${errorMessage}，稍后会自动重试。` : '云端数据同步失败，稍后会自动重试。',
      );
      if (!pendingSnapshotRef.current) {
        pendingSnapshotRef.current = snapshot;
        setIsFlushPending(true);
        scheduleFlush();
      }
    } finally {
      isFlushingRef.current = false;
      setIsFlushing(false);
    }
  }, [enabled, scheduleFlush]);

  useEffect(() => {
    flushPendingSyncRef.current = flushPendingSync;
  }, [flushPendingSync]);

  const queueSnapshotSync = useCallback(
    (nextTasks: MatrixTask[]) => {
      const snapshot = sortTasks(nextTasks.map(normalizeCloudTask));
      clearPullTimer();
      pendingSnapshotRef.current = snapshot;
      setIsFlushPending(true);
      scheduleFlush();
    },
    [clearPullTimer, scheduleFlush],
  );

  const commitOptimistic = useCallback(
    (updater: (currentTasks: MatrixTask[]) => MatrixTask[]) => {
      setTasks((currentTasks) => {
        const nextTasks = sortTasks(updater(currentTasks).map(normalizeCloudTask));
        tasksRef.current = nextTasks;
        queueSnapshotSync(nextTasks);
        return nextTasks;
      });
    },
    [queueSnapshotSync],
  );

  const reloadTasks = useCallback(
    async (options: { silent?: boolean } = {}) => {
      if (!enabled) {
        clearSyncTimer();
        clearPullTimer();
        pendingSnapshotRef.current = null;
        setIsFlushPending(false);
        setHasLoadedOnce(false);
        setIsLoading(false);
        setIsPulling(false);
        setTasks([]);
        tasksRef.current = [];
        return;
      }

      if (pendingSnapshotRef.current || isFlushingRef.current || isPullingRef.current || isSyncPausedRef.current) {
        return;
      }

      const requestPauseVersion = syncPauseVersionRef.current;
      isPullingRef.current = true;
      setIsPulling(true);
      if (!options.silent) {
        setIsLoading(true);
      }
      lastPullAtRef.current = Date.now();
      try {
        const response = await apiRequest<{ tasks: MatrixTask[] }>('/api/tasks');
        if (!pendingSnapshotRef.current && !isSyncPausedRef.current && requestPauseVersion === syncPauseVersionRef.current) {
          const nextTasks = sortTasks(response.tasks.map(normalizeCloudTask));
          tasksRef.current = nextTasks;
          setTasks(nextTasks);
        }
        if (!isSyncPausedRef.current && requestPauseVersion === syncPauseVersionRef.current) {
          setStorageError(null);
        }
      } catch (error) {
        if (!isSyncPausedRef.current && requestPauseVersion === syncPauseVersionRef.current) {
          const errorMessage = readRequestErrorMessage(error);
          setStorageError(
            errorMessage ? `云端数据读取失败：${errorMessage}。` : '云端数据读取失败，请检查后端服务和网络。',
          );
        }
      } finally {
        isPullingRef.current = false;
        setIsPulling(false);
        if (!options.silent) {
          setHasLoadedOnce(true);
          setIsLoading(false);
        }
      }
    },
    [clearPullTimer, clearSyncTimer, enabled],
  );

  const scheduleReload = useCallback(
    (options: { silent?: boolean } = { silent: true }) => {
      if (
        !enabled ||
        pendingSnapshotRef.current ||
        isFlushingRef.current ||
        isPullingRef.current ||
        isSyncPausedRef.current
      ) {
        return;
      }

      const elapsed = Date.now() - lastPullAtRef.current;
      const delay = Math.max(0, CLOUD_PULL_DEBOUNCE_MS - elapsed);
      clearPullTimer();
      pullTimerRef.current = window.setTimeout(() => {
        pullTimerRef.current = null;
        void reloadTasks(options);
      }, delay);
    },
    [clearPullTimer, enabled, reloadTasks],
  );

  const pauseSync = useCallback(() => {
    syncPauseDepthRef.current += 1;
    if (syncPauseDepthRef.current === 1) {
      isSyncPausedRef.current = true;
      syncPauseVersionRef.current += 1;
    }

    clearSyncTimer();
    clearPullTimer();
  }, [clearPullTimer, clearSyncTimer]);

  const resumeSync = useCallback(() => {
    if (syncPauseDepthRef.current === 0) {
      return;
    }

    syncPauseDepthRef.current -= 1;
    if (syncPauseDepthRef.current > 0) {
      return;
    }

    isSyncPausedRef.current = false;
    if (!enabled) {
      return;
    }

    if (pendingSnapshotRef.current) {
      setIsFlushPending(true);
      scheduleFlush();
      return;
    }

    scheduleReload({ silent: true });
  }, [enabled, scheduleFlush, scheduleReload]);

  useEffect(() => {
    void reloadTasks();
  }, [reloadTasks]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const pollTimer = window.setInterval(() => {
      scheduleReload({ silent: true });
    }, CLOUD_PULL_INTERVAL_MS);

    return () => {
      window.clearInterval(pollTimer);
    };
  }, [enabled, scheduleReload]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const requestFocusReload = () => {
      scheduleReload({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestFocusReload();
      }
    };

    window.addEventListener('focus', requestFocusReload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', requestFocusReload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, scheduleReload]);

  useEffect(() => clearSyncTimer, [clearSyncTimer]);
  useEffect(() => clearPullTimer, [clearPullTimer]);

  const addTask = useCallback(async (input: TaskFormValues) => {
    commitOptimistic((currentTasks) => [toTaskFromInput(input), ...currentTasks]);
  }, [commitOptimistic]);

  const updateTask = useCallback(async (taskId: string, input: TaskFormValues) => {
    commitOptimistic((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? toTaskFromInput(input, task) : task)),
    );
  }, [commitOptimistic]);

  const updateTaskMetrics = useCallback(async (taskId: string, metrics: Partial<TaskMetrics>) => {
    commitOptimistic((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        return {
          ...task,
          importance: clampMetric(metrics.importance, task.importance),
          urgency: clampMetric(metrics.urgency, task.urgency),
          progress: task.autoProgress
            ? calculateSubtaskProgress(task.subtasks)
            : clampMetric(metrics.progress, task.progress),
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, [commitOptimistic]);

  const toggleTask = useCallback(async (taskId: string) => {
    commitOptimistic((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
  }, [commitOptimistic]);

  const toggleAxisVisibility = useCallback(async (taskId: string) => {
    commitOptimistic((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, showOnAxis: !task.showOnAxis, updatedAt: new Date().toISOString() }
          : task,
      ),
    );
  }, [commitOptimistic]);

  const deleteTask = useCallback(async (taskId: string) => {
    commitOptimistic((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
  }, [commitOptimistic]);

  const clearCompletedTasks = useCallback(async () => {
    commitOptimistic((currentTasks) => currentTasks.filter((task) => !task.completed));
  }, [commitOptimistic]);

  const replaceCloudTasks = useCallback(async (nextTasks: MatrixTask[]) => {
    const snapshot = sortTasks(nextTasks.map(normalizeCloudTask));
    clearSyncTimer();
    clearPullTimer();
    pendingSnapshotRef.current = null;
    setIsFlushPending(false);
    isFlushingRef.current = true;
    setIsFlushing(true);
    try {
      const response = await submitTaskSnapshot(snapshot);
      lastPullAtRef.current = Date.now();
      const cloudTasks = sortTasks(response.tasks.map(normalizeCloudTask));
      tasksRef.current = cloudTasks;
      setTasks(cloudTasks);
      setStorageError(null);
    } catch (error) {
      const errorMessage = readRequestErrorMessage(error);
      setStorageError(
        errorMessage ? `云端数据同步失败：${errorMessage}，请稍后重试。` : '云端数据同步失败，请稍后重试。',
      );
      throw new Error('Cloud sync failed');
    } finally {
      isFlushingRef.current = false;
      setIsFlushing(false);
    }
  }, [clearPullTimer, clearSyncTimer]);

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
    clearCompletedTasks,
    deleteTask,
    isInitialLoading: enabled && !hasLoadedOnce && isLoading,
    isLoading,
    isSyncing: isLoading || isPulling || isFlushing,
    pauseSync,
    reloadTasks,
    replaceCloudTasks,
    resumeSync,
    stats,
    storageError,
    tasks,
    toggleAxisVisibility,
    toggleTask,
    updateTask,
    updateTaskMetrics,
  };
}
