const api = require('../../utils/api');
const {
  clearLocalTasks,
  clampMetric,
  createTask,
  loadLocalTasks,
  normalizeTasks,
  saveLocalTasks,
  sortTasks,
  toTaskPayload
} = require('../../utils/tasks');

function showModal(options) {
  return new Promise((resolve) => {
    wx.showModal({
      ...options,
      success: resolve,
      fail: () => resolve({ confirm: false, cancel: true })
    });
  });
}

Page({
  data: {
    axisHeight: 320,
    axisWidth: 320,
    draggingTaskId: '',
    expandedTaskId: '',
    filter: 'active',
    isAccountMenuOpen: false,
    isCloudMode: false,
    isLoading: false,
    isSyncing: false,
    stats: { active: 0, completed: 0, shownOnAxis: 0, total: 0 },
    storageError: '',
    tasks: [],
    user: null,
    visibleTasks: []
  },

  onReady() {
    this.measureAxis();
  },

  onShow() {
    this.loadCurrentMode();
  },

  measureAxis() {
    wx.createSelectorQuery()
      .in(this)
      .select('#axisCanvas')
      .boundingClientRect((rect) => {
        this.setData(
          {
            axisHeight: rect && rect.height ? rect.height : 320,
            axisWidth: rect && rect.width ? rect.width : 320
          },
          () => this.drawAxis()
        );
      })
      .exec();
  },

  async loadCurrentMode() {
    const user = api.getUser();
    this.setData({ user, isCloudMode: Boolean(user), storageError: '' });

    if (user) {
      const localTasks = loadLocalTasks();
      if (localTasks.length > 0) {
        await this.resolveLocalTasks(localTasks);
      }
      await this.loadCloudTasks();
      return;
    }

    this.setTasks(loadLocalTasks());
  },

  async resolveLocalTasks(localTasks) {
    const firstChoice = await showModal({
      title: '处理本地任务',
      content: `当前设备还有 ${localTasks.length} 个本地任务。是否上传并覆盖云端任务？`,
      confirmText: '上传云端',
      cancelText: '其他'
    });

    if (firstChoice.confirm) {
      await this.replaceCloudTasks(localTasks);
      clearLocalTasks();
      return;
    }

    const secondChoice = await showModal({
      title: '保留云端数据',
      content: '如果保留云端数据，将删除当前设备上的本地任务副本。',
      confirmText: '删除本地',
      cancelText: '退出登录'
    });

    if (secondChoice.confirm) {
      clearLocalTasks();
      return;
    }

    await api.logout();
    this.setData({ user: null, isCloudMode: false });
  },

  async loadCloudTasks() {
    this.setData({ isLoading: true, isSyncing: true, storageError: '' });
    try {
      const response = await api.request({ url: '/tasks' });
      this.setTasks(response.tasks || []);
    } catch (error) {
      this.setData({ storageError: error.message || '云端数据读取失败' });
      this.setTasks([]);
    } finally {
      this.setData({ isLoading: false, isSyncing: false });
    }
  },

  async replaceCloudTasks(tasks) {
    this.setData({ isSyncing: true });
    try {
      await api.request({
        url: '/migration/replace-tasks',
        method: 'POST',
        data: { tasks: tasks.map(toTaskPayload) }
      });
    } finally {
      this.setData({ isSyncing: false });
    }
  },

  setTasks(tasks) {
    this.setData({ tasks: normalizeTasks(tasks) }, () => this.refreshDerived());
  },

  refreshDerived() {
    const tasks = sortTasks(this.data.tasks);
    const completed = tasks.filter((task) => task.completed).length;
    const shownOnAxis = tasks.filter((task) => task.showOnAxis && !task.completed).length;
    let visibleTasks = tasks.filter((task) => !task.completed);

    if (this.data.filter === 'all') {
      visibleTasks = tasks;
    } else if (this.data.filter === 'completed') {
      visibleTasks = tasks.filter((task) => task.completed);
    } else if (this.data.filter === 'axis') {
      visibleTasks = tasks.filter((task) => task.showOnAxis && !task.completed);
    }

    this.setData(
      {
        stats: {
          active: tasks.length - completed,
          completed,
          shownOnAxis,
          total: tasks.length
        },
        tasks,
        visibleTasks
      },
      () => this.drawAxis()
    );
  },

  handleFilterTap(event) {
    this.setData({ filter: event.currentTarget.dataset.filter }, () => this.refreshDerived());
  },

  toggleAccountMenu() {
    this.setData({ isAccountMenuOpen: !this.data.isAccountMenuOpen });
  },

  closeAccountMenu() {
    if (this.data.isAccountMenuOpen) {
      this.setData({ isAccountMenuOpen: false });
    }
  },

  noop() {},

  openAuth() {
    wx.navigateTo({ url: '/pages/auth/auth' });
  },

  openChangePassword() {
    this.closeAccountMenu();
    wx.navigateTo({ url: '/pages/change-password/change-password' });
  },

  async handleLogout() {
    this.closeAccountMenu();
    await api.logout();
    this.setData({ user: null, isCloudMode: false });
    this.setTasks(loadLocalTasks());
  },

  openCreateTask() {
    getApp().globalData.editingTask = null;
    wx.navigateTo({
      url: '/pages/task-editor/task-editor?mode=create',
      events: {
        saveTask: (values) => this.saveTask(values)
      }
    });
  },

  openEditTask(event) {
    const task = this.data.tasks.find((item) => item.id === event.currentTarget.dataset.id);
    if (!task) {
      return;
    }

    getApp().globalData.editingTask = task;
    wx.navigateTo({
      url: `/pages/task-editor/task-editor?mode=edit&id=${task.id}`,
      events: {
        saveTask: (values) => this.saveTask(values, task.id)
      }
    });
  },

  async saveTask(values, taskId) {
    if (taskId) {
      await this.persistTaskPatch(taskId, toTaskPayload(values, { omitInvalidColor: true }), true);
      return;
    }

    if (this.data.isCloudMode) {
      this.setData({ isSyncing: true });
      try {
        const response = await api.request({
          url: '/tasks',
          method: 'POST',
          data: toTaskPayload(values)
        });
        this.setTasks([response.task, ...this.data.tasks]);
      } finally {
        this.setData({ isSyncing: false });
      }
      return;
    }

    const nextTasks = sortTasks([createTask(values), ...this.data.tasks]);
    saveLocalTasks(nextTasks);
    this.setTasks(nextTasks);
  },

  toggleExpand(event) {
    const taskId = event.currentTarget.dataset.id;
    this.setData({ expandedTaskId: this.data.expandedTaskId === taskId ? '' : taskId });
  },

  async toggleTask(event) {
    const taskId = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((item) => item.id === taskId);
    if (task) {
      await this.persistTaskPatch(taskId, { completed: !task.completed }, true);
    }
  },

  async toggleAxis(event) {
    const taskId = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((item) => item.id === taskId);
    if (task) {
      await this.persistTaskPatch(taskId, { showOnAxis: !task.showOnAxis }, true);
    }
  },

  async handleMetricChange(event) {
    const taskId = event.currentTarget.dataset.id;
    const field = event.currentTarget.dataset.field;
    await this.persistTaskPatch(taskId, { [field]: clampMetric(event.detail.value) }, true);
  },

  async requestDeleteTask(event) {
    const taskId = event.currentTarget.dataset.id;
    const task = this.data.tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    const result = await showModal({
      title: '确认删除任务？',
      content: `删除后将移除“${task.title}”。`,
      confirmText: '删除',
      confirmColor: '#d32f2f'
    });

    if (!result.confirm) {
      return;
    }

    if (this.data.isCloudMode) {
      this.setData({ isSyncing: true });
      try {
        await api.request({ url: `/tasks/${taskId}`, method: 'DELETE' });
      } finally {
        this.setData({ isSyncing: false });
      }
    }

    const nextTasks = this.data.tasks.filter((item) => item.id !== taskId);
    if (!this.data.isCloudMode) {
      saveLocalTasks(nextTasks);
    }
    this.setTasks(nextTasks);
  },

  async persistTaskPatch(taskId, patch, optimistic) {
    const currentTasks = this.data.tasks;
    const nextTasks = currentTasks.map((task) =>
      task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task
    );

    if (optimistic) {
      this.setTasks(nextTasks);
    }

    if (!this.data.isCloudMode) {
      saveLocalTasks(nextTasks);
      return;
    }

    this.setData({ isSyncing: true });
    try {
      const response = await api.request({
        url: `/tasks/${taskId}`,
        method: 'PATCH',
        data: patch
      });
      this.setTasks(currentTasks.map((task) => (task.id === taskId ? response.task : task)));
    } catch (error) {
      this.setTasks(currentTasks);
      wx.showToast({ icon: 'none', title: error.message || '同步失败' });
    } finally {
      this.setData({ isSyncing: false });
    }
  },

  getAxisTasks() {
    return this.data.tasks.filter((task) => task.showOnAxis && !task.completed);
  },

  taskToPoint(task) {
    const padding = 34;
    const width = this.data.axisWidth;
    const height = this.data.axisHeight;
    const plotWidth = Math.max(1, width - padding * 2);
    const plotHeight = Math.max(1, height - padding * 2);

    return {
      x: padding + (clampMetric(task.importance) / 100) * plotWidth,
      y: height - padding - (clampMetric(task.urgency) / 100) * plotHeight
    };
  },

  pointToMetrics(x, y) {
    const padding = 34;
    const width = this.data.axisWidth;
    const height = this.data.axisHeight;
    const plotWidth = Math.max(1, width - padding * 2);
    const plotHeight = Math.max(1, height - padding * 2);
    const nextX = Math.max(padding, Math.min(width - padding, x));
    const nextY = Math.max(padding, Math.min(height - padding, y));

    return {
      importance: clampMetric(((nextX - padding) / plotWidth) * 100),
      urgency: clampMetric(((height - padding - nextY) / plotHeight) * 100)
    };
  },

  findNearestTask(x, y) {
    let nearestTask = null;
    let nearestDistance = Infinity;

    this.getAxisTasks().forEach((task) => {
      const point = this.taskToPoint(task);
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTask = task;
      }
    });

    return nearestDistance <= 28 ? nearestTask : null;
  },

  handleAxisTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) {
      return;
    }

    const task = this.findNearestTask(touch.x, touch.y);
    if (!task) {
      return;
    }

    this.setData({ draggingTaskId: task.id });
    this.updateDraggingTask(touch.x, touch.y);
  },

  handleAxisTouchMove(event) {
    const touch = event.touches && event.touches[0];
    if (!touch || !this.data.draggingTaskId) {
      return;
    }

    this.updateDraggingTask(touch.x, touch.y);
  },

  async handleAxisTouchEnd() {
    const taskId = this.data.draggingTaskId;
    if (!taskId) {
      return;
    }

    const task = this.data.tasks.find((item) => item.id === taskId);
    this.setData({ draggingTaskId: '' });
    if (task) {
      await this.persistTaskPatch(taskId, { importance: task.importance, urgency: task.urgency }, false);
    }
  },

  updateDraggingTask(x, y) {
    const metrics = this.pointToMetrics(x, y);
    const nextTasks = this.data.tasks.map((task) =>
      task.id === this.data.draggingTaskId ? { ...task, ...metrics } : task
    );
    this.setData({ tasks: nextTasks }, () => this.refreshDerived());
  },

  drawAxis() {
    const width = this.data.axisWidth;
    const height = this.data.axisHeight;
    if (!width || !height) {
      return;
    }

    const padding = 34;
    const ctx = wx.createCanvasContext('axisCanvas', this);
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, width, height);
    ctx.setStrokeStyle('#e5e7eb');
    ctx.setLineWidth(1);

    for (let index = 0; index <= 4; index += 1) {
      const x = padding + ((width - padding * 2) / 4) * index;
      const y = padding + ((height - padding * 2) / 4) * index;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.setStrokeStyle('#94a3b8');
    ctx.setLineWidth(2);
    ctx.beginPath();
    ctx.moveTo(width / 2, padding);
    ctx.lineTo(width / 2, height - padding);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - padding, height / 2);
    ctx.stroke();

    ctx.setFillStyle('#64748b');
    ctx.setFontSize(11);
    ctx.fillText('紧急程度', padding, 22);
    ctx.fillText('重要程度', width - 82, height - 10);

    this.getAxisTasks().forEach((task) => {
      const point = this.taskToPoint(task);
      const active = this.data.draggingTaskId === task.id;
      ctx.beginPath();
      ctx.setFillStyle(task.color || '#1976d2');
      ctx.arc(point.x, point.y, active ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.setFillStyle(active ? '#172033' : 'rgba(23, 32, 51, 0.72)');
      ctx.setFontSize(12);
      const prefix = task.progress > 0 ? `${task.progress}% ` : '';
      const label = `${prefix}${task.title}`.slice(0, 18);
      ctx.fillText(label, Math.min(point.x + 9, width - 126), Math.max(20, point.y - 8));
    });

    ctx.draw();
  }
});
