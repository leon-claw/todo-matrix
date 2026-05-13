import type { MatrixTask } from '../types';

const DB_NAME = 'todo-matrix-db';
const DB_VERSION = 1;
const STORE_NAME = 'records';
const TASKS_KEY = 'tasks';
const FALLBACK_KEY = 'todo-matrix:fallback-tasks';

interface TaskRecord {
  key: typeof TASKS_KEY;
  value: MatrixTask[];
  updatedAt: string;
}

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = runner(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function readFallback(): MatrixTask[] | null {
  const raw = localStorage.getItem(FALLBACK_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as MatrixTask[];
  } catch {
    return null;
  }
}

function writeFallback(tasks: MatrixTask[]) {
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(tasks));
}

export async function loadTasks(): Promise<MatrixTask[] | null> {
  if (!hasIndexedDb()) {
    return readFallback();
  }

  try {
    const record = await withStore<TaskRecord | undefined>('readonly', (store) =>
      store.get(TASKS_KEY),
    );
    return record?.value ?? null;
  } catch {
    return readFallback();
  }
}

export async function saveTasks(tasks: MatrixTask[]): Promise<void> {
  writeFallback(tasks);

  if (!hasIndexedDb()) {
    return;
  }

  const record: TaskRecord = {
    key: TASKS_KEY,
    value: tasks,
    updatedAt: new Date().toISOString(),
  };

  await withStore<IDBValidKey>('readwrite', (store) => store.put(record));
}
