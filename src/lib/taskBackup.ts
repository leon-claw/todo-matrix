import { z } from 'zod';
import type { MatrixTask } from '../types';

export type TaskBackupStorageMode = 'cloud' | 'local';

export interface TaskBackup {
  exportedAt: string;
  format: 'todo-matrix-backup';
  storageMode: TaskBackupStorageMode;
  tasks: MatrixTask[];
  version: 1;
}

export type TaskBackupFileResult =
  | { type: 'empty' }
  | {
      backup: TaskBackup;
      fileName: string;
      json: string;
      type: 'ready';
    };

const subTodoSchema = z.object({
  completed: z.boolean(),
  id: z.string().min(1),
  title: z.string(),
});

const matrixTaskSchema = z.object({
  autoProgress: z.boolean(),
  color: z.string().min(1),
  completed: z.boolean(),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  importance: z.number().finite(),
  notes: z.string(),
  progress: z.number().finite(),
  showOnAxis: z.boolean(),
  subtasks: z.array(subTodoSchema),
  title: z.string().min(1),
  updatedAt: z.string().datetime(),
  urgency: z.number().finite(),
});

const taskBackupSchema = z.object({
  exportedAt: z.string().datetime(),
  format: z.literal('todo-matrix-backup'),
  storageMode: z.enum(['cloud', 'local']),
  tasks: z.array(matrixTaskSchema),
  version: z.literal(1),
});

export function createTaskBackupFile({
  exportedAt = new Date(),
  storageMode,
  tasks,
}: {
  exportedAt?: Date;
  storageMode: TaskBackupStorageMode;
  tasks: MatrixTask[];
}): TaskBackupFileResult {
  if (tasks.length === 0) {
    return { type: 'empty' };
  }

  const backup: TaskBackup = {
    exportedAt: exportedAt.toISOString(),
    format: 'todo-matrix-backup',
    storageMode,
    tasks,
    version: 1,
  };

  return {
    backup,
    fileName: `todo-matrix-backup-${backup.exportedAt.slice(0, 10)}.json`,
    json: `${JSON.stringify(backup, null, 2)}\n`,
    type: 'ready',
  };
}

export function parseTaskBackup(json: string): TaskBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('无效的 JSON 备份文件');
  }

  const result = taskBackupSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error('无效或不支持的 Todo Matrix 备份文件');
  }

  return result.data;
}

export async function saveTaskBackupFile(file: Extract<TaskBackupFileResult, { type: 'ready' }>) {
  const blob = new Blob([file.json], { type: 'application/json;charset=utf-8' });

  if (window.Capacitor?.isNativePlatform?.()) {
    const nativeFile = new File([blob], file.fileName, { type: blob.type });
    if (!navigator.canShare?.({ files: [nativeFile] }) || !navigator.share) {
      throw new Error('Native file sharing is unavailable');
    }

    await navigator.share({
      files: [nativeFile],
      title: 'Todo Matrix 数据备份',
    });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.download = file.fileName;
  anchor.href = objectUrl;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
