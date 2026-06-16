import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createTaskBackupFile, parseTaskBackup } from '../src/lib/taskBackup';
import type { MatrixTask } from '../src/types';

const task: MatrixTask = {
  autoProgress: true,
  color: '#2563eb',
  completed: false,
  createdAt: '2026-06-01T08:00:00.000Z',
  id: 'task-1',
  importance: 8,
  notes: '记得带材料',
  progress: 50,
  showOnAxis: true,
  subtasks: [
    {
      completed: true,
      id: 'subtask-1',
      title: '准备材料',
    },
    {
      completed: false,
      id: 'subtask-2',
      title: '确认时间',
    },
  ],
  title: '办理事项',
  updatedAt: '2026-06-09T10:00:00.000Z',
  urgency: 7,
};

test('creates a versioned JSON backup containing the complete current task data', () => {
  const result = createTaskBackupFile({
    exportedAt: new Date('2026-06-10T12:34:56.000Z'),
    storageMode: 'cloud',
    tasks: [task],
  });

  assert.equal(result.type, 'ready');
  if (result.type !== 'ready') {
    return;
  }

  assert.equal(result.fileName, 'todo-matrix-backup-2026-06-10.json');
  assert.deepEqual(JSON.parse(result.json), {
    exportedAt: '2026-06-10T12:34:56.000Z',
    format: 'todo-matrix-backup',
    storageMode: 'cloud',
    tasks: [task],
    version: 1,
  });
});

test('does not create a backup file when there are no tasks', () => {
  assert.deepEqual(
    createTaskBackupFile({
      exportedAt: new Date('2026-06-10T12:34:56.000Z'),
      storageMode: 'local',
      tasks: [],
    }),
    { type: 'empty' },
  );
});

test('parses a valid Todo Matrix backup for restoring data', () => {
  const result = parseTaskBackup(
    JSON.stringify({
      exportedAt: '2026-06-10T12:34:56.000Z',
      format: 'todo-matrix-backup',
      storageMode: 'local',
      tasks: [task],
      version: 1,
    }),
  );

  assert.deepEqual(result, {
    exportedAt: '2026-06-10T12:34:56.000Z',
    format: 'todo-matrix-backup',
    storageMode: 'local',
    tasks: [task],
    version: 1,
  });
});

test('rejects malformed or unsupported backup files', () => {
  assert.throws(() => parseTaskBackup('{"format":"something-else","tasks":[]}'), /无效|不支持/);
  assert.throws(() => parseTaskBackup('not json'), /无效/);
});
