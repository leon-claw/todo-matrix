const { COLOR_OPTIONS, emptyTask, toTaskPayload } = require('../../utils/tasks');

Page({
  data: {
    colorOptions: COLOR_OPTIONS,
    mode: 'create',
    values: emptyTask()
  },

  onLoad(options) {
    const task = getApp().globalData.editingTask;
    const mode = options.mode === 'edit' ? 'edit' : 'create';
    this.setData({
      mode,
      values: task ? toTaskPayload(task) : emptyTask()
    });
    wx.setNavigationBarTitle({ title: mode === 'edit' ? '编辑任务' : '添加任务' });
  },

  onUnload() {
    getApp().globalData.editingTask = null;
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`values.${field}`]: event.detail.value });
  },

  handleSlider(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`values.${field}`]: event.detail.value });
  },

  handleSwitch(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`values.${field}`]: event.detail.value });
  },

  chooseColor(event) {
    this.setData({ 'values.color': event.currentTarget.dataset.color });
  },

  submit() {
    const values = toTaskPayload(this.data.values);
    if (!values.title) {
      wx.showToast({ icon: 'none', title: '请输入任务标题' });
      return;
    }

    const eventChannel = this.getOpenerEventChannel();
    eventChannel.emit('saveTask', values);
    wx.navigateBack();
  }
});
