const LOCAL_TASKS_KEY = 'todo_matrix_local_tasks';
const DEFAULT_COLOR = '#1976d2';
const COLOR_OPTIONS = ['#1976d2', '#2e7d32', '#ed6c02', '#9c27b0', '#d32f2f', '#00838f', '#6d4c41'];

function clampMetric(value) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getTaskScore(task) {
  return task.importance + task.urgency;
}

function sortTasks(tasks) {
  return [...tasks].sort((left, right) => {
    if (left.completed !== right.completed) {
      return Number(left.completed) - Number(right.completed);
    }
    const scoreDiff = getTaskScore(right) - getTaskScore(left);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function normalizeTask(task) {
  const createdAt = task.createdAt || nowIso();
  return {
    id: task.id || createId(),
    title: String(task.title || '').trim() || '未命名任务',
    notes: String(task.notes || ''),
    importance: clampMetric(task.importance ?? 50),
    urgency: clampMetric(task.urgency ?? 50),
    color: /^#[0-9a-fA-F]{6}$/.test(task.color || '') ? task.color : DEFAULT_COLOR,
    progress: clampMetric(task.progress ?? 0),
    showOnAxis: task.showOnAxis !== false,
    completed: task.completed === true,
    createdAt,
    updatedAt: task.updatedAt || createdAt
  };
}

function normalizeTasks(tasks) {
  return sortTasks((tasks || []).map(normalizeTask));
}

function loadLocalTasks() {
  return normalizeTasks(wx.getStorageSync(LOCAL_TASKS_KEY) || []);
}

function saveLocalTasks(tasks) {
  wx.setStorageSync(LOCAL_TASKS_KEY, normalizeTasks(tasks));
}

function clearLocalTasks() {
  wx.removeStorageSync(LOCAL_TASKS_KEY);
}

function createTask(values) {
  return normalizeTask({
    ...values,
    id: createId(),
    completed: false,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
}

function isValidColor(color) {
  return /^#[0-9a-fA-F]{6}$/.test(color || '');
}

function toTaskPayload(task, options = {}) {
  const payload = {
    title: String(task.title || '').trim(),
    notes: String(task.notes || '').trim(),
    importance: clampMetric(task.importance),
    urgency: clampMetric(task.urgency),
    progress: clampMetric(task.progress),
    showOnAxis: task.showOnAxis !== false,
    completed: task.completed === true
  };

  if (isValidColor(task.color)) {
    payload.color = task.color;
  } else if (!options.omitInvalidColor) {
    payload.color = DEFAULT_COLOR;
  }

  return payload;
}

function emptyTask() {
  return {
    title: '',
    notes: '',
    importance: 50,
    urgency: 50,
    color: DEFAULT_COLOR,
    progress: 0,
    showOnAxis: true
  };
}

module.exports = {
  COLOR_OPTIONS,
  DEFAULT_COLOR,
  clearLocalTasks,
  clampMetric,
  createTask,
  emptyTask,
  isValidColor,
  loadLocalTasks,
  normalizeTask,
  normalizeTasks,
  saveLocalTasks,
  sortTasks,
  toTaskPayload
};
