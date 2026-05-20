const api = require('../../utils/api');

Page({
  data: {
    confirmPassword: '',
    currentPassword: '',
    error: '',
    isLoading: false,
    nextPassword: ''
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [field]: event.detail.value });
  },

  async submit() {
    const { confirmPassword, currentPassword, nextPassword } = this.data;
    this.setData({ error: '' });

    if (!currentPassword) {
      this.setData({ error: '请输入当前密码。' });
      return;
    }

    if (nextPassword.length < 8) {
      this.setData({ error: '新密码至少需要 8 位。' });
      return;
    }

    if (nextPassword !== confirmPassword) {
      this.setData({ error: '两次输入的新密码不一致。' });
      return;
    }

    this.setData({ isLoading: true });
    try {
      await api.request({
        url: '/auth/change-password',
        method: 'POST',
        data: { currentPassword, nextPassword }
      });
      wx.showToast({ title: '密码已修改' });
      wx.navigateBack();
    } catch (error) {
      this.setData({ error: error.message || '修改密码失败' });
    } finally {
      this.setData({ isLoading: false });
    }
  }
});
